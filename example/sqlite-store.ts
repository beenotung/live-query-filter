import { createLiveQueryFilter } from 'live-query-filter'
import { newDB, migrateUp } from 'better-sqlite3-schema'
import { LiveState } from 'live-state.ts'
import { join } from 'path'

let filter = createLiveQueryFilter()

let db = newDB({
  path: join('data', 'store.db'),
  migrate: false,
})

migrateUp({
  db,
  migrations: [
    {
      name: 'create user',
      up: /* sql */ `
create table user (
  id integer primary key
, username text
)`,
      down: /* sql */ `drop table user`,
    },
    {
      name: 'create post',
      up: /* sql */ `
create table post (
  id integer primary key
, content text
, create_time integer default current_timestamp
)`,
      down: /* sql */ `drop table post`,
    },
    {
      name: 'add post author',
      up: /* sql */ `
alter table post add column user_id integer references user(id)
`,
      down: /* sql */ `
alter table post rename column user_id to _user_id
`,
    },
    {
      name: 'add like relation',
      up: /* sql */ `
create table like (
  id integer primary key
, user_id integer references user(id)
, post_id integer references post(id)
, timestamp integer default current_timestamp
)
`,
      down: /* sql */ `drop table like`,
    },
  ],
})

function seed(table: string, rows: any[]) {
  rows.forEach(row => {
    try {
      db.insert(table, row)
    } catch (error) {
      // skip duplicated data
    }
  })
}

seed('user', [{ id: 1, username: 'alice' }])
seed('post', [
  { id: 1, content: 'hello world', user_id: 1 },
  { id: 2, content: 'live query demo', user_id: 1 },
])

let select_post = db.prepare(/* sql */ `
select
  post.id
, content
, timestamp
, count(*) as likes
from post
left join like on post.id = like.post_id
where post.id = ?
group by post.id
`)
function selectPost(id: number) {
  type Post = { id: number; content: string; timestamp: string; likes: number }
  let state = LiveState.of<Post>(select_post.get(id))
  let unsubscribe = filter.subscribe(
    [{ table: 'post', id }, { table: 'like' }],
    () => state.update(select_post.get(id)),
  )
  state.attach({
    teardown: unsubscribe,
  })
  return state
}

let post1State = selectPost(1)
post1State.map(post => {
  console.log('report post 1:', post)
})

let post2State = selectPost(2)
post2State.map(post => {
  console.log('report post 2:', post)
})

let insert_like = db.prepare('insert into like (post_id, user_id) values (?,1)')
function likePost(post_id: number) {
  console.log('[likePost]', post_id)
  insert_like.run(post_id)
  filter.publish([{ table: 'like' }])
}

console.log('both active')
likePost(1)
likePost(2)

console.log('teardown post 1')
post1State.teardown()

likePost(1)
likePost(2)

console.log('teardown post 2')
post2State.teardown()

likePost(1)
likePost(2)
