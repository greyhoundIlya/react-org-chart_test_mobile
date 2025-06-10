const d3 = require('d3')
const { wrapText, helpers, covertImageToBase64 } = require('../utils')
const renderLines = require('./renderLines')
const exportOrgChartImage = require('./exportOrgChartImage')
const exportOrgChartPdf = require('./exportOrgChartPdf')
const onClick = require('./onClick')
const iconLink = require('./components/iconLink')
const supervisorIcon = require('./components/supervisorIcon')
const CHART_NODE_CLASS = 'org-chart-node'
const PERSON_LINK_CLASS = 'org-chart-person-link'
const PERSON_NAME_CLASS = 'org-chart-person-name'
const PERSON_TITLE_CLASS = 'org-chart-person-title'
const PERSON_HIGHLIGHT = 'org-chart-person-highlight'
const PERSON_REPORTS_CLASS = 'org-chart-person-reports'

function render(config) {
  const {
    svgroot,
    svg,
    tree,
    animationDuration,
    nodeWidth,
    nodeHeight,
    nodePaddingX,
    nodePaddingY,
    nodeBorderRadius,
    backgroundColor,
    nameColor,
    titleColor,
    reportsColor,
    borderColor,
    avatarWidth,
    lineDepthY,
    treeData,
    sourceNode,
    onPersonLinkClick,
    loadImage,
    downloadImageId,
    downloadPdfId,
    elemWidth,
    margin,
    onConfigChange,
  } = config

  // Compute the new tree layout.
  const nodes = window.innerWidth <= 460 ? tree.nodes(treeData) : tree.nodes(treeData).reverse()
  const links = tree.links(nodes)

  config.links = links
  config.nodes = nodes

  // Normalize for fixed-depth.
  if (typeof window !== 'undefined' && window.innerWidth <= 460) {
    nodes.forEach((d, i) => {
      d.x = 0
      d.y = i * lineDepthY
    })
  } else {
    nodes.forEach(d => {
      d.y = d.depth * lineDepthY
    })
  }

  // Update the nodes
  const node = svg.selectAll('g.' + CHART_NODE_CLASS).data(
    nodes.filter(d => d.id),
    d => d.id
  )

  const parentNode = sourceNode || treeData

  svg.selectAll('#supervisorIcon').remove()

  supervisorIcon({
    svg: svg,
    config,
    treeData,
    x: 70,
    y: -24,
  })

  // Enter any new nodes at the parent's previous position.
  const nodeEnter = node
    .enter()
    .insert('g')
    .attr('class', CHART_NODE_CLASS)
    .attr('transform', `translate(${parentNode.x0}, ${parentNode.y0})`)
    .on('click', window.innerWidth <= 460 ? mobileOnClick(config) : onClick(config))

  // Person Card Shadow
  nodeEnter
    .append('rect')
    .attr('width', nodeWidth)
    .attr('height', nodeHeight)
    .attr('fill', backgroundColor)
    .attr('stroke', borderColor)
    .attr('rx', nodeBorderRadius)
    .attr('ry', nodeBorderRadius)
    .attr('fill-opacity', 0.05)
    .attr('stroke-opacity', 0.025)
    .attr('filter', 'url(#boxShadow)')

  // Person Card Container
  nodeEnter
    .append("rect")
    .attr("class", (d) => (d.isHighlight ? `${PERSON_HIGHLIGHT} box` : "box"))
    .attr("width", nodeWidth)
    .attr("height", nodeHeight)
    .attr("id", (d) => d.id)
    .attr("fill", "#E6F3FF")
    .attr("stroke", "#ebeef2")
    .attr("stroke-width", 2)
    .attr("rx", 8)
    .attr("ry", 8)
    .style("cursor", "pointer")

  // Добавление прямоугольного блока
  nodeEnter
    .append("rect")
    .attr("class", "custom-block")
    .attr("width", 240)
    .attr("height", 40)
    .attr("x", 0)
    .attr("y", 140)
    .attr("fill", d => (d.children || d._children ? '#ebeef2' : '#31c8eb'))
    .attr("stroke-width", 1)
    .attr("rx", 5)
    .attr("ry", 5);

  // Person's Name
  nodeEnter
    .append('text')
    .attr('class', PERSON_NAME_CLASS + ' unedited')
    .attr('x', 140)
    .attr('y', 62)
    .style('fill', '#2C3E50')
    .style('font-size', 16)
    .text(d => d.person.name)
  //.on('click', onParentClick(config))

  // Person's Title
  nodeEnter
    .append("text")
    .attr("class", "department-title")
    .attr("x", nodeWidth / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", 12)
    .style("font-weight", "bold")
    .style("fill", "#2C3E50")
    .text((d) => d.person.title)

  // Заголовок департамента (верхняя часть карточки)
  nodeEnter
    .append("text")
    .attr("class", "department-title")
    .attr("x", nodeWidth / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", 12)
    .style("font-weight", "bold")
    .style("fill", "#2C3E50")
    .text((d) => d.person.title)


  // Person's Avatar
  nodeEnter
    .append('image')
    .attr('id', d => `image-${d.id}`)
    .attr('width', 42)
    .attr('height', 42)
    .attr('x', 20)
    .attr('y', 36)
    .attr('s', d => {
      d.person.hasImage
        ? d.person.avatar
        : loadImage(d).then(res => {
          covertImageToBase64(res, function (dataUrl) {
            d3.select(`#image-${d.id}`).attr('href', dataUrl)
            d.person.avatar = dataUrl
          })
          d.person.hasImage = true
          return d.person.avatar
        })
    })
    .attr('src', d => d.person.avatar)
    .attr('href', d => d.person.avatar || '..examples/assets/avatar-personnel.svg')

  // Person's Reports
  nodeEnter
    .append('text')
    .attr('class', PERSON_REPORTS_CLASS)
    .attr('x', 70)
    .attr('y', 150)
    .attr('dy', '.9em')
    .style('font-size', 16)
    .style('font-weight', 600)
    .style('cursor', 'pointer')
    .style('fill', reportsColor)
    .text(helpers.getTextForTitle)

  // Линия разделитель под заголовком
  nodeEnter
    .append("line")
    .attr("x1", 10)
    .attr("y1", 30)
    .attr("x2", nodeWidth - 10)
    .attr("y2", 30)
    .attr("stroke", "#31c8eb")
    .attr("stroke-width", 1)
    .attr("opacity", 0.3)


  // Liния разделитель под заголовком департамента
  nodeEnter
    .append("line")
    .attr("x1", 10)
    .attr("y1", 85)
    .attr("x2", nodeWidth - 10)
    .attr("y2", 85)
    .attr("stroke", "#31c8eb")
    .attr("stroke-width", 1)
    .attr("opacity", 0.3)

  // Person's Title
  nodeEnter
    .append("text")
    .attr("x", 15)
    .attr("y", 100)
    .style("font-size", 10)
    .style("font-weight", "bold")
    .style("fill", "#7F8C8D")
    .text("Subordinates")



  // Person's Title  сотрудников
  nodeEnter
    .append("text")
    .attr("x", 15)
    .attr("y", 115)
    .style("font-size", 10)
    .style("fill", "#7F8C8D")
    .text((d) => {
      const count = d.children ? d.children.length : d._children ? d._children.length : 0
      return `${count} Employees`
    })


  // Person's Link
  const nodeLink = nodeEnter
    .append('a')
    .attr('class', PERSON_LINK_CLASS)
    .attr('display', d => (d.person.link ? '' : 'none'))
    .attr('xlink:href', d => d.person.link)
    .on('click', datum => {
      d3.event.stopPropagation()
      // TODO: fire link click handler
      if (onPersonLinkClick) {
        onPersonLinkClick(datum, d3.event)
      }
    })

  iconLink({
    svg: nodeLink,
    x: nodeWidth - 20,
    y: 8,
  })

  // Transition nodes to their new position.
  const nodeUpdate = node
    .transition()
    .duration(animationDuration)
    .attr('transform', d => `translate(${d.x},${d.y})`)

  nodeUpdate
    .select('rect.box')
    .attr('fill', backgroundColor)
    .attr('stroke', d => (d.children || d._children ? '#ebeef2' : '#31c8eb'))

  // Transition exiting nodes to the parent's new position.
  const nodeExit = node
    .exit()
    .transition()
    .duration(animationDuration)
    .attr('transform', d => `translate(${parentNode.x},${parentNode.y})`)
    .remove()

  // Update the links
  const link = svg.selectAll('path.link').data(links, d => d.target.id)

  // Wrap the title texts
  const wrapWidth = 124
  svg.selectAll('text.unedited.' + PERSON_NAME_CLASS).call(wrapText, wrapWidth)
  svg.selectAll('text.unedited.' + PERSON_TITLE_CLASS).call(wrapText, wrapWidth)

  // Render lines connecting nodes
  renderLines(config)

  // Stash the old positions for transition.
  nodes.forEach(function (d) {
    d.x0 = d.x
    d.y0 = d.y
  })

  var nodeLeftX = -70
  var nodeRightX = 70
  var nodeY = 200
  nodes.map(d => {
    nodeLeftX = d.x < nodeLeftX ? d.x : nodeLeftX
    nodeRightX = d.x > nodeRightX ? d.x : nodeRightX
    nodeY = d.y > nodeY ? d.y : nodeY
  })

  config.nodeRightX = nodeRightX
  config.nodeY = nodeY
  config.nodeLeftX = nodeLeftX * -1

  d3.select(downloadImageId).on('click', function () {
    exportOrgChartImage(config)
  })

  d3.select(downloadPdfId).on('click', function () {
    exportOrgChartPdf(config)
  })
  onConfigChange(config)
}
module.exports = render
