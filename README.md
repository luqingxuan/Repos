just like it's name, Repos can position element & pop element show with certain rule,
use:
```
import Repos from './index.js';

$(input).on('focus',function(){
  Repos({
    ele: input,
    pop: datepicker,
    cnt: document.body,
    offsetX: 0,
    offsetY: 0,
    alignX: 'inner-left',
    alignY: 'bottom'
  })
});

```
and now u will see a datepicker show when input focus,
remember i just cal the position, not care show hide datepicker, just do simple thing.

by the way, it like https://github.com/HubSpot/tether,
but i reference https://github.com/vadikom/poshytip for align rule
