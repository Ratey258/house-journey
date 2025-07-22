import common from './common';
import market from './market';
import player from './player';
import events from './events';
import ui from './ui';
import errors from './errors';

export default {
  ...common,
  ...market,
  ...player,
  ...events,
  ...ui,
  ...errors
};
