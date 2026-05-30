function Link(el)
  if el.classes:includes('zoom') then
    -- If the link content is empty, add the default text and icon
    if #el.content == 0 then
      el.content = pandoc.Inlines({
        pandoc.Str("🔍"),
        pandoc.Space(),
        pandoc.Str("Zoom sur cette section")
      })
    end

    -- For HTML output, we can add extra styling if needed, 
    -- but currently the .zoom CSS class handles most of it.
    if quarto.doc.is_format('html') then
      -- Standard link with .zoom class is fine
      return el
    elseif quarto.doc.is_format('typst') then
      -- For Typst, keep it as a link but maybe remove the emoji if it causes issues?
      -- Actually, Typst handles emojis fine usually.
      return el
    end
  end
end
