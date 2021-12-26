import { expect } from 'chai'
import sinon, { SinonSpy } from 'sinon'
import { publish, subscribe, Unsubscribe } from '../src/filter'
import debug, { Debugger } from 'debug'

context('Filter spec', () => {
  let log: Debugger
  before(() => {
    log = debug('filter.spec')
  })
  it('should not throw error when publish to table without pre-defined subscriptions', () => {
    publish([{ table: 'new_table' }])
  })
  it('should not throw error when publish to field without pre-defined subscriptions', () => {
    publish([{ table: 'new_table', field: '*' }])
    publish([{ table: 'new_table', fields: ['new_field2', 'new_field3'] }])
  })
  context('unsubscribe', () => {
    let callback: SinonSpy
    let unsubscribe: Unsubscribe
    before(() => {
      callback = sinon.spy()
    })
    it('should trigger callback after subscribe', () => {
      unsubscribe = subscribe([{ table: 'user' }], callback)
      expect(callback.callCount).to.equals(0)
      publish([{ table: 'user' }])
      expect(callback.callCount).to.equals(1)
    })
    it('should not trigger callback after unsubscribe', () => {
      unsubscribe()
      publish([{ table: 'user' }])
      expect(callback.callCount).to.equals(1)
    })
  })
  it('should trigger update to wildcard field', () => {
    let callback = sinon.spy()
    subscribe([{ table: 'user', field: '*' }], callback)
    expect(callback.callCount).to.equals(0)
    publish([{ table: 'user', field: 'field1' }])
    expect(callback.callCount).to.equals(1)
  })

  it('should only trigger related subscriptions', () => {
    let count_user = sinon.spy()
    subscribe([{ table: 'user' }], count_user)

    let look_up_user_by_username = sinon.spy()
    subscribe(
      [{ table: 'user', fields: ['username'] }],
      look_up_user_by_username,
    )

    let select_user_1_username = sinon.spy()
    subscribe(
      [{ table: 'user', id: 1, fields: ['username'] }],
      select_user_1_username,
    )

    let select_user_2_username = sinon.spy()
    subscribe(
      [{ table: 'user', id: 2, field: 'username' }],
      select_user_2_username,
    )

    let select_user_2_rank = sinon.spy()
    subscribe([{ table: 'user', id: 2, fields: ['rank'] }], select_user_2_rank)

    let select_multiple_user = sinon.spy()
    subscribe([{ table: 'user', ids: [2, 3] }], select_multiple_user)

    let select_post_by_timestamp = sinon.spy()
    subscribe([{ table: 'post' }], select_post_by_timestamp)

    let select_post_1 = sinon.spy()
    subscribe([{ table: 'post', id: 1 }], select_post_1)

    expect(count_user.callCount).to.equals(0)
    expect(look_up_user_by_username.callCount).to.equals(0)
    expect(select_user_1_username.callCount).to.equals(0)
    expect(select_user_2_username.callCount).to.equals(0)
    expect(select_user_2_rank.callCount).to.equals(0)
    expect(select_multiple_user.callCount).to.equals(0)
    expect(select_post_by_timestamp.callCount).to.equals(0)
    expect(select_post_1.callCount).to.equals(0)

    log('# insert user')
    publish([{ table: 'user' }])
    expect(count_user.callCount).to.equals(1)
    expect(look_up_user_by_username.callCount).to.equals(1)
    expect(select_user_1_username.callCount).to.equals(1)
    expect(select_user_2_username.callCount).to.equals(1)
    expect(select_user_2_rank.callCount).to.equals(1)
    expect(select_multiple_user.callCount).to.equals(1)
    expect(select_post_by_timestamp.callCount).to.equals(0)
    expect(select_post_1.callCount).to.equals(0)

    log('# update user[1].username')
    publish([{ table: 'user', id: 1, fields: ['username'] }])
    expect(count_user.callCount).to.equals(2)
    expect(look_up_user_by_username.callCount).to.equals(2)
    expect(select_user_1_username.callCount).to.equals(2)
    expect(select_user_2_username.callCount).to.equals(1)
    expect(select_user_2_rank.callCount).to.equals(1)
    expect(select_multiple_user.callCount).to.equals(1)
    expect(select_post_by_timestamp.callCount).to.equals(0)
    expect(select_post_1.callCount).to.equals(0)

    log('# update user[2].username')
    publish([{ table: 'user', id: 2, fields: ['username'] }])
    expect(count_user.callCount).to.equals(3)
    expect(look_up_user_by_username.callCount).to.equals(3)
    expect(select_user_1_username.callCount).to.equals(2)
    expect(select_user_2_username.callCount).to.equals(2)
    expect(select_user_2_rank.callCount).to.equals(1)
    expect(select_multiple_user.callCount).to.equals(2)
    expect(select_post_by_timestamp.callCount).to.equals(0)
    expect(select_post_1.callCount).to.equals(0)

    log('# update user[2].rank')
    publish([{ table: 'user', id: 2, field: 'rank' }])
    expect(count_user.callCount).to.equals(4)
    expect(look_up_user_by_username.callCount).to.equals(3)
    expect(select_user_1_username.callCount).to.equals(2)
    expect(select_user_2_username.callCount).to.equals(2)
    expect(select_user_2_rank.callCount).to.equals(2)
    expect(select_multiple_user.callCount).to.equals(3)
    expect(select_post_by_timestamp.callCount).to.equals(0)
    expect(select_post_1.callCount).to.equals(0)

    log('# update user[3,4]')
    publish([{ table: 'user', ids: [3, 4] }])
    expect(count_user.callCount).to.equals(5)
    expect(look_up_user_by_username.callCount).to.equals(4)
    expect(select_user_1_username.callCount).to.equals(2)
    expect(select_user_2_username.callCount).to.equals(2)
    expect(select_user_2_rank.callCount).to.equals(2)
    expect(select_multiple_user.callCount).to.equals(4)
    expect(select_post_by_timestamp.callCount).to.equals(0)
    expect(select_post_1.callCount).to.equals(0)

    log('# update post 1')
    publish([{ table: 'post', id: 1 }])
    expect(count_user.callCount).to.equals(5)
    expect(look_up_user_by_username.callCount).to.equals(4)
    expect(select_user_1_username.callCount).to.equals(2)
    expect(select_user_2_username.callCount).to.equals(2)
    expect(select_user_2_rank.callCount).to.equals(2)
    expect(select_multiple_user.callCount).to.equals(4)
    expect(select_post_by_timestamp.callCount).to.equals(1)
    expect(select_post_1.callCount).to.equals(1)
  })
})
