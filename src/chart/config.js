const animationDuration = 350
const shouldResize = true

// Nodes
const nodeWidth = 240
const nodeHeight = 180
const nodeSpacing = 12
const nodePaddingX = 16
const nodePaddingY = 16
const avatarWidth = 48
const nodeBorderRadius = 8
const margin = {
  top: 20,
  right: 90,
  bottom: 20,
  left: 90,
}

// Lines
const lineType = "curve"
const lineDepthY = 120 /* Height of the line for child nodes */

// Colors
const backgroundColor = '#fff'
const borderColor = '#e2e8f0'
const nameColor = '#1e293b'
const titleColor = '#64748b'
const reportsColor = '#b82f6'

const config = {
  margin,
  animationDuration,
  nodeWidth,
  nodeHeight,
  nodeSpacing,
  nodePaddingX,
  nodePaddingY,
  nodeBorderRadius,
  avatarWidth,
  lineType,
  lineDepthY,
  backgroundColor,
  borderColor,
  nameColor,
  titleColor,
  reportsColor,
  shouldResize,
}

module.exports = config
