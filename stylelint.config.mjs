/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard', 'stylelint-config-clean-order'],
  plugins: ['stylelint-declaration-strict-value'],
  reportNeedlessDisables: true,
  reportInvalidScopeDisables: true,
  reportDescriptionlessDisables: true,
  rules: {
    // Component styles only use the design tokens, never literal colours.
    'scale-unlimited/declaration-strict-value': [
      ['/color$/', 'fill', 'stroke'],
      {
        ignoreValues: [
          'Highlight',
          'HighlightText',
          'Canvas',
          'CanvasText',
          'ButtonText',
          'GrayText',
          'LinkText',
          'transparent',
          'currentColor',
          'inherit',
          'none',
          'initial',
          'unset',
          '0',
          'auto',
        ],
        ignoreFunctions: true,
        disableFix: true,
      },
    ],
    'color-no-hex': true,
    'color-named': 'never',
    // Hover, focus and disabled states are ordered by meaning, not by specificity.
    'no-descending-specificity': null,
    'declaration-no-important': true,
    'selector-max-id': 0,
    'selector-max-compound-selectors': 4,
    'max-nesting-depth': 2,
    'selector-class-pattern': [
      '^tumaet-ui-[a-z0-9]+(?:-[a-z0-9]+)*$',
      { message: 'Class names start with tumaet-ui-' },
    ],
    'custom-property-pattern': [
      '^(?:tumaet-ui-|_)[a-z0-9]+(?:-[a-z0-9]+)*$',
      { message: 'Custom properties start with --tumaet-ui-' },
    ],
  },
  overrides: [
    {
      // The theme file is where the literal colours are defined.
      files: ['src/styles/themes.css'],
      rules: {
        'color-no-hex': null,
        'scale-unlimited/declaration-strict-value': null,
      },
    },
  ],
};
