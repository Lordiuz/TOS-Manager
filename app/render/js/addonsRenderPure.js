function renderAddons (addons, profiles) {
  var parts = [];

  for (var id = 0; ; id++) {
    var addon = addons[id];
    var profile = profiles[id];
    if (!addon) break;

    var classes = 'flex_column';
    if (profile) {
      if (profile['installed']) classes += ' installed';
      if (addon['latest'] > profile['installed']) classes += ' outofdate';
    }

    parts.push(
      `<div class="${classes}" id="addon_${id}">` +
      `<div class="flex_row">` +
      `<a id="addon_${id}_detail" class="icon addon_details" onclick="addonListShow(this)" title="Show Addons"></a>` +
      `<div class="flex_cell_item addon_name">${addon['name']}</div>` +
      `<div class="addon_btn"><a class="icon addon_install_btn" onclick="addonInstall(${id})" title="Install">Install</a></div>` +
      `<div class="addon_btn"><a class="icon addon_update_btn" onclick="addonUpdate(${id})" title="Update">Update</a></div>` +
      `<div class="addon_btn"><a class="icon addon_remove_btn" onclick="addonRemove(${id})" title="Remove">Remove</a></div>` +
      `</div>`
    );

    if (addon['modes'] && addon['modes'].length) {
      parts.push(`<div class="flex_column addon_list_details" id="addon_${id}_details">`);
      for (var num = 0; num < addon['modes'].length; num++) {
        var item = addon['modes'][num];
        if (!item) continue;
        parts.push(
          `<div class="flex_column">` +
          `<div class="flex_row flex_row_note">` +
          `<div class="flex_cell_item">${item['name']}</div>` +
          `</div>` +
          (item['description']
            ? `<div class="flex_row flex_row_descr">` +
              `<div class="flex_cell_item">${item['description']}</div>` +
              `</div>`
            : '') +
          `</div>`
        );
      }
      parts.push(`</div>`);
    }

    parts.push(`</div>`);
  }

  return parts.join('');
}

module.exports = renderAddons;

