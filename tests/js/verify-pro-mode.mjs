import {
  getConfigDefaults,
  isUnconfigured,
  withPrefilledDefaults,
} from '../../resources/js/pages/Backend/CMS/Sections/utils/proMode.js';

let failures = 0;
const check = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) console.log(`        expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
};

const defaults = getConfigDefaults('HomeBanner');
check('HomeBanner has at least one default', Object.keys(defaults).length > 0, true);
check('unknown component yields no defaults', getConfigDefaults('NotARealComponent'), {});
check('empty-string default is omitted', defaults.bgColor, undefined);
check('empty-string sectionClassName omitted', defaults.sectionClassName, undefined);
check('numeric defaults survive', getConfigDefaults('TextContentSection').paddingY !== undefined, true);

check('fresh section gets defaults', withPrefilledDefaults('HomeBanner', {}).height, defaults.height);
check('existing value not overwritten', withPrefilledDefaults('HomeBanner', { height: 'h-50' }).height, 'h-50');
check('deliberately blanked value stays blank', withPrefilledDefaults('HomeBanner', { height: '' }).height, '');
check('null stored value tolerated', withPrefilledDefaults('HomeBanner', null).height, defaults.height);
check('garbage stored value tolerated', withPrefilledDefaults('HomeBanner', 'garbage').height, defaults.height);

check('unconfigured with no props and no data', isUnconfigured({ component: 'HomeBanner', custom_props: {}, data: null }), true);
check('configured once props exist', isUnconfigured({ custom_props: { height: 'h-50' }, data: null }), false);
check('configured once data exists', isUnconfigured({ custom_props: {}, data: { heading: 'hi' } }), false);
check('null section is not unconfigured', isUnconfigured(null), false);

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);