const test = require('node:test');
const assert = require('node:assert/strict');
const renderAddons = require('./addonsRenderPure');

test('renderAddons renders addons list with modes and classes', () => {
  const addons = [
    {
      name: 'Addon One',
      latest: 2,
      modes: [
        { name: 'Mode A', description: 'Description A' },
        { name: 'Mode B' } // без description
      ]
    },
    {
      name: 'Addon Two',
      latest: 1,
      modes: []
    }
  ];

  const profiles = [
    { installed: 1 },        // установлен и устаревший (latest > installed)
    { installed: 0 }         // не установлен
  ];

  const html = renderAddons(addons, profiles);

  // базовая структура по id
  assert.ok(html.includes('id="addon_0"'), 'addon_0 should be rendered');
  assert.ok(html.includes('id="addon_1"'), 'addon_1 should be rendered');

  // классы для первого аддона: установлен и устаревший
  assert.ok(
    html.includes('class="flex_column installed outofdate"') ||
    html.includes('class="flex_column outofdate installed"'),
    'addon_0 should have installed and outofdate classes'
  );

  // имя аддона и кнопки действий
  assert.ok(html.includes('Addon One'), 'addon name should be rendered');
  assert.ok(html.includes('addon_install_btn'), 'install button should be present');
  assert.ok(html.includes('addon_update_btn'), 'update button should be present');
  assert.ok(html.includes('addon_remove_btn'), 'remove button should be present');

  // блок деталей и режимы
  assert.ok(html.includes('id="addon_0_details"'), 'details container for addon_0 should be rendered');
  assert.ok(html.includes('Mode A'), 'mode name should be rendered');
  assert.ok(html.includes('Description A'), 'mode description should be rendered');

  // отсутствие лишних аддонов (цикл должен остановиться на первом undefined)
  assert.ok(!html.includes('addon_2'), 'addon_2 should not be rendered');
});

