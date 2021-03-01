import { Nodes } from "./Nodes";

export interface CanvasElement {
    x: number
    y: number
    color: string
    size: number
    text: string
    rotate: number
    nodes: Nodes
  }
  