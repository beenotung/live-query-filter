# live-query-filter

Publish and subscribe to database queries, serve as backbone of live query change detection engine.

Designed for web-redux

[![npm Package Version](https://img.shields.io/npm/v/live-query-filter.svg?maxAge=3600)](https://www.npmjs.com/package/live-query-filter)

## Usage Example

```typescript
import { createLiveQueryFilter } from 'live-query-filter'
import sinon from 'sinon' // for testing

let filter = createLiveQueryFilter()

let select_user1_profile = sinon.spy()

filter.subscribe(
  [{ table: 'user', id: 1, fields: ['username', 'rank'] }],
  select_user1_profile,
)
console.log(select_user1_profile.callCount) // 0

filter.publish([{ table: 'user', id: 1, fields: ['username'] }])
console.log(select_user1_profile.callCount) // 1
```

More examples refer to [filter.spec.ts](./test/filter.spec.ts)

## License

This project is licensed with [BSD-2-Clause](./LICENSE)

This is free, libre, and open-source software. It comes down to four essential freedoms [[ref]](https://seirdy.one/2021/01/27/whatsapp-and-the-domestication-of-users.html#fnref:2):

- The freedom to run the program as you wish, for any purpose
- The freedom to study how the program works, and change it so it does your computing as you wish
- The freedom to redistribute copies so you can help others
- The freedom to distribute copies of your modified versions to others
