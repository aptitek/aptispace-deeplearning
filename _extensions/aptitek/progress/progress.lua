function Span(el)
  if el.classes:includes('progress-bar') then
    local progress = el.attributes['data-progress'] or el.attributes['progress']
    if progress then
      local width_str = progress
      if not width_str:match("%%$") then 
        width_str = width_str .. "%" 
      end
      
      -- Remove custom attributes
      el.attributes['data-progress'] = nil
      el.attributes['progress'] = nil
      
      -- Add Bootstrap styles and aria attributes
      el.attributes['style'] = "width: " .. width_str .. ";"
      el.attributes['aria-valuenow'] = progress:gsub("%%", "")

      -- Wrap in a span with class progress
      -- Using raw HTML inside a Pandoc inline structure is safer to enforce block rendering 
      -- if we use a div, but since we're in an inline context, we can return RawInline
      -- We'll use RawInline to ensure it's a <div> exactly as Bootstrap expects.
      
      local classes = table.concat(el.classes, " ")
      local style = el.attributes['style']
      local aria = el.attributes['aria-valuenow']
      
      local html = string.format(
        '<div class="progress" style="height: 6px;"><div class="%s" style="%s" aria-valuenow="%s"></div></div>',
        classes, style, aria
      )
      
      return pandoc.RawInline('html', html)
    end
  end
end
