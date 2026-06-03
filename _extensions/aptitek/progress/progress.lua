function Span(el)
  if el.classes:includes('progress-bar') then
    local progress = el.attributes['data-progress'] or el.attributes['progress']
    if progress then
      local progress_value = tonumber(progress:gsub("%%", "")) or 0
      progress_value = math.max(0, math.min(100, math.floor(progress_value + 0.5)))
      
      -- Remove custom attributes
      el.attributes['data-progress'] = nil
      el.attributes['progress'] = nil
      
      -- Add Bootstrap classes and aria attributes
      el.classes:insert("progress-value-" .. progress_value)
      el.attributes['aria-valuenow'] = tostring(progress_value)

      -- Wrap in a span with class progress
      -- Using raw HTML inside a Pandoc inline structure is safer to enforce block rendering 
      -- if we use a div, but since we're in an inline context, we can return RawInline
      -- We'll use RawInline to ensure it's a <div> exactly as Bootstrap expects.
      
      local classes = table.concat(el.classes, " ")
      local aria = el.attributes['aria-valuenow']
      
      local html = string.format(
        '<div class="progress apt-progress"><div class="%s" aria-valuenow="%s"></div></div>',
        classes, aria
      )
      
      return pandoc.RawInline('html', html)
    end
  end
end
