import { mat4, quat, vec3, vec4 } from "gl-matrix"
import { Game } from "../../model/game"
import { createSquareModel, disposeRenderingModel } from "../../resources/models"
import { compileShaderProgramFromSource } from "../../shader"
import { scannerRadialWorldRange } from "../../constants"
import { ShipRoleEnum } from "../../model/ShipInstance"
import { Resources } from "../../resources/resources"
import { setCommonAttributes, setViewUniformLocations } from "../coregl/programInfo"

function initShaderProgram(gl: WebGL2RenderingContext, resources: Resources) {
  const shaderProgram = compileShaderProgramFromSource(gl, resources.shaderSource.uColor)
  if (!shaderProgram) {
    return null
  }

  return {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix")!,
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix")!,
      color: gl.getUniformLocation(shaderProgram, "uColor")!,
    },
  }
}

export function createScannerShipRenderer(
  gl: WebGL2RenderingContext,
  resources: Resources,
  projectionMatrix: mat4,
  scale: vec3,
) {
  // TODO: we need to position this on the bottom middle i.e (-1.0,2.0 to 1.0,0.0)
  const verticalLine = [0.5, 0.0, 0.0, 1.5, 0.0, 0.0, 1.5, 1.0, 0.0, 0.5, 1.0, 0.0]
  const lineCap = [-0.5, 0.0, 0.0, 1.5, 0.0, 0.0, 1.5, 1, 0.0, -0.5, 1, 0.0]
  const verticalLineModel = createSquareModel(gl, [0.0, 1.0, 0.0, 1.0], verticalLine)
  const lineCapModel = createSquareModel(gl, [0.0, 1.0, 0.0, 1.0], lineCap)
  const programInfo = initShaderProgram(gl, resources)!

  const dispose = () => {
    disposeRenderingModel(gl, verticalLineModel)
    disposeRenderingModel(gl, lineCapModel)
  }
  const render = (game: Game) => {
    if (game.player.isDocked) {
      return
    }

    game.localBubble.ships.forEach((ship) => {
      const normalisedPosition = vec3.divide(vec3.create(), ship.position, scannerRadialWorldRange)
      if (
        Math.abs(normalisedPosition[0]) > 1.0 ||
        Math.abs(normalisedPosition[1]) > 1.0 ||
        Math.abs(normalisedPosition[2]) > 1.0
      ) {
        // out of scanning range
        return
      }

      const scannerPosition = vec3.multiply(vec3.create(), [normalisedPosition[0], 0.05, normalisedPosition[2]], scale)
      let yScale = normalisedPosition[1] * scale[1]
      const verticalLineModelViewMatrix = mat4.fromRotationTranslationScale(
        mat4.create(),
        quat.create(),
        scannerPosition,
        [0.1, yScale, 1.0],
      )
      const lineCapPosition = vec3.add(vec3.create(), scannerPosition, [0, yScale - 0.05, 0])
      const lineCapModelViewMatrix = mat4.fromRotationTranslationScale(
        mat4.create(),
        quat.create(),
        lineCapPosition,
        [0.1, 0.1, 1.0],
      )

      const color =
        ship.role === ShipRoleEnum.Cargo || ship.role === ShipRoleEnum.Asteroid
          ? vec4.fromValues(1.0, 0.0, 0.0, 1.0)
          : vec4.fromValues(0.0, 1.0, 0.0, 1.0)

      gl.useProgram(programInfo.program)
      setCommonAttributes(gl, { position: verticalLineModel.position }, programInfo)
      setViewUniformLocations(gl, programInfo, {
        projectionMatrix,
        modelViewMatrix: verticalLineModelViewMatrix,
        color,
      })

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, verticalLineModel.indices)
      {
        const vertexCount = verticalLineModel.vertexCount
        const type = gl.UNSIGNED_SHORT
        const offset = 0
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset)
      }

      setCommonAttributes(gl, { position: lineCapModel.position }, programInfo)
      setViewUniformLocations(gl, programInfo, {
        modelViewMatrix: lineCapModelViewMatrix,
      })

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineCapModel.indices)
      {
        const vertexCount = lineCapModel.vertexCount
        const type = gl.UNSIGNED_SHORT
        const offset = 0
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset)
      }
    })
  }
  return { render, dispose }
}
