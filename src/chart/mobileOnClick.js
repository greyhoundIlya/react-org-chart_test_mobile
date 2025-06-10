const d3 = require('d3')
const { collapse } = require('../utils')

module.exports = mobileOnClick

function mobileOnClick(configOnClick) {
  const { loadConfig } = configOnClick

  return datum => {
    if (d3.event.defaultPrevented) return
    const config = loadConfig()
    const { loadChildren, render, onPersonClick, svg, elemWidth, elemHeight, margin } = config
    
    // Предотвращаем стандартное поведение
    d3.event.preventDefault()
    d3.event.stopPropagation()

    if (onPersonClick) {
      const result = onPersonClick(datum, d3.event)
      if (typeof result === 'boolean' && !result) {
        return
      }
    }

    // Проверяем, является ли устройство мобильным
    const isMobile = window.innerWidth <= 460

    if (!isMobile) {
      // Для десктопа используем стандартное поведение
      handleStandardClick(config, datum)
      return
    }

    // Мобильная логика - центрируем только выбранный узел
    handleMobileClick(config, datum)
  }
}

function handleStandardClick(config, datum) {
  const { loadChildren, render } = config

  // Если у узла нет детей, но hasChild = true, загружаем детей
  if (!datum.children && !datum._children && datum.hasChild) {
    if (!loadChildren) {
      console.error('react-org-chart.onClick: loadChildren() not found in config')
      return
    }

    const result = loadChildren(datum)
    const handler = handleChildrenResult(config, datum)

    if (result.then) {
      return result.then(handler)
    } else {
      return handler(result)
    }
  }

  // Переключаем состояние детей
  if (datum.children) {
    config.callerNode = datum
    config.callerMode = 0
    datum._children = datum.children
    datum.children = null
  } else {
    config.callerNode = datum
    config.callerMode = 1
    datum.children = datum._children
    datum._children = null
  }

  render({
    ...config,
    sourceNode: datum,
  })
}

function handleMobileClick(config, datum) {
  const { svg, elemWidth, elemHeight, margin, nodeHeight, lineDepthY } = config
  
  // Вычисляем позицию для центрирования узла
  const centerX = elemWidth / 2 - margin.left / 2
  const centerY = elemHeight / 2 - margin.top / 2
  
  // Текущая позиция узла
  const nodeX = datum.x
  const nodeY = datum.y
  
  // Вычисляем смещение для центрирования
  const translateX = centerX - nodeX
  const translateY = centerY - nodeY
  
  // Получаем текущий zoom объект
  const zoom = d3.behavior.zoom()
  
  // Плавная анимация к центрированному узлу
  d3.transition()
    .duration(500)
    .tween('zoom', function() {
      const iTranslateX = d3.interpolate(0, translateX)
      const iTranslateY = d3.interpolate(0, translateY)
      
      return function(t) {
        const newTranslateX = iTranslateX(t)
        const newTranslateY = iTranslateY(t)
        
        svg.attr('transform', `translate(${newTranslateX}, ${newTranslateY})`)
      }
    })
    .each('end', function() {
      // После завершения анимации обрабатываем логику узла
      handleNodeLogic(config, datum)
    })
}

function handleNodeLogic(config, datum) {
  const { loadChildren, render } = config

  // Если у узла нет детей, но hasChild = true, загружаем детей
  if (!datum.children && !datum._children && datum.hasChild) {
    if (!loadChildren) {
      console.error('react-org-chart.onClick: loadChildren() not found in config')
      return
    }

    const result = loadChildren(datum)
    const handler = handleChildrenResult(config, datum)

    if (result.then) {
      return result.then(handler)
    } else {
      return handler(result)
    }
  }

  // Переключаем состояние детей
  if (datum.children) {
    config.callerNode = datum
    config.callerMode = 0
    datum._children = datum.children
    datum.children = null
  } else {
    config.callerNode = datum
    config.callerMode = 1
    datum.children = datum._children
    datum._children = null
  }

  render({
    ...config,
    sourceNode: datum,
  })
}

function handleChildrenResult(config, datum) {
  const { tree, render } = config

  return children => {
    const result = {
      ...datum,
      children,
    }

    children.forEach(collapse)

    result.children.forEach(child => {
      if (!tree.nodes(datum)[0]._children) {
        tree.nodes(datum)[0]._children = []
      }

      child.x = datum.x
      child.y = datum.y
      child.x0 = datum.x0
      child.y0 = datum.y0

      tree.nodes(datum)[0]._children.push(child)
    })

    if (datum.children) {
      config.callerNode = datum
      config.callerMode = 0
      datum._children = datum.children
      datum.children = null
    } else {
      config.callerNode = null
      config.callerMode = 1
      datum.children = datum._children
      datum._children = null
    }

    render({
      ...config,
      sourceNode: result,
    })
  }
}