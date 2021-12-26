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
