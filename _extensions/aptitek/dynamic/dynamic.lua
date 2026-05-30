local function has_class(el, class_name)
  for _, c in ipairs(el.classes) do
    if c == class_name then
      return true
    end
  end
  return false
end


local function handle_controls(div)
  local title = div.attributes["header"] or div.attributes["title"]

  -- If first element is a paragraph with just strong text, use it as title (legacy support)
  if not title and #div.content > 0 and div.content[1].t == "Para" and #div.content[1].content == 1 and div.content[1].content[1].t == "Strong" then
    title = pandoc.utils.stringify(div.content[1])
    table.remove(div.content, 1)
  end

  local new_content = pandoc.List()
  local group_div = pandoc.Div(div.content, pandoc.Attr("", { "org-controls-group" }))

  new_content:insert(group_div)

  local attr = pandoc.Attr(div.identifier, { "org-controls" }, div.attributes)
  return pandoc.Div(new_content, attr)
end

local function transform_dynamic_div(el)
  if has_class(el, "dynamic") then
    local has_controls = false
    local components = pandoc.List()
    local header_text = el.attributes["header"]

    if header_text then
      local figcaption = pandoc.Div({ pandoc.Plain({ pandoc.Str(header_text) }) }, pandoc.Attr("", { "tpl-main-title" }))
      components:insert(figcaption)
    end

    for _, block in ipairs(el.content) do
      if block.t == "Div" then
        if has_class(block, "controls") then
          components:insert(handle_controls(block))
          has_controls = true
        elseif has_class(block, "render") then
          local new_classes = pandoc.List()
          new_classes:insert("org-render")
          for _, c in ipairs(block.classes) do
            if c ~= "render" then new_classes:insert(c) end
          end
          block.classes = new_classes
          components:insert(block)
        elseif has_class(block, "results") then
          local new_classes = pandoc.List()
          new_classes:insert("org-results")
          for _, c in ipairs(block.classes) do
            if c ~= "results" then new_classes:insert(c) end
          end
          block.classes = new_classes
          components:insert(block)
        elseif has_class(block, "separator") then
          block.classes = pandoc.List({ "mol-separator" })
          components:insert(block)
        else
          components:insert(block)
        end
      elseif block.t == "Header" and block.level == 4 then
        -- Legacy support for #### Title inside .dynamic
        if not header_text then
          local figcaption = pandoc.Div({ pandoc.Plain(block.content) }, pandoc.Attr("", { "tpl-main-title" }))
          components:insert(figcaption)
        end
      else
        components:insert(block)
      end
    end

    local container_classes = { "tpl-dynamic" }
    if has_controls then
      table.insert(container_classes, "has-controls")
    end

    for _, c in ipairs(container_classes) do
      if not has_class(el, c) then
        el.classes:insert(c)
      end
    end

    el.content = components
    return el
  end
end

local js_files = {
  "js/core.js",
  "js/atom.js",
  "js/mol.js",
  "js/card.js",
  "js/terminal.js",
  "js/canvas.js",
  "js/compat.js",
  "js/monitor.js"
}

-- Use a filter list to control execution order
return {
  {
    -- Pass 1: Transform all .dynamic Divs and mark if we found any
    Div = function(el)
      if has_class(el, "dynamic") then
        _G.has_dynamic_in_doc = true
        return transform_dynamic_div(el)
      end
    end
  },
  {
    -- Second pass: Inject dependency if needed
    Pandoc = function(doc)
      if _G.has_dynamic_in_doc then
        quarto.doc.add_html_dependency({
          name = 'aptitek-dynamic',
          version = '1.0.0',
          scripts = js_files
        })
      end
      return doc
    end
  }
}
