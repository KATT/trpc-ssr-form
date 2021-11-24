import Link from 'next/link';
import { useSSRForm } from 'utils/useSSRForm';
import { trpc } from '../utils/trpc';
import { NextPageWithLayout } from './_app';

const IndexPage: NextPageWithLayout = () => {
  const utils = trpc.useContext();
  const postsQuery = trpc.useQuery(['post.all']);
  const addPost = trpc.useMutation('post.add', {
    async onSuccess() {
      // refetches posts after a post is added
      await utils.invalidateQueries(['post.all']);
    },
  });

  const methods = useSSRForm('post.add');

  // prefetch all posts for instant navigation
  // useEffect(() => {
  //   for (const { id } of postsQuery.data ?? []) {
  //     utils.prefetchQuery(['post.byId', { id }]);
  //   }
  // }, [postsQuery.data, utils]);

  return (
    <>
      <h1>Welcome to your tRPC starter!</h1>
      <p>
        Check <a href="https://trpc.io/docs">the docs</a> whenever you get
        stuck, or ping <a href="https://twitter.com/alexdotjs">@alexdotjs</a> on
        Twitter.
      </p>

      <h2>
        Posts
        {postsQuery.status === 'loading' && '(loading)'}
      </h2>
      {postsQuery.data?.map((item) => (
        <article key={item.id}>
          <h3>{item.title}</h3>
          <Link href={`/post/${item.id}`}>
            <a>View more</a>
          </Link>
        </article>
      ))}

      <hr />

      <form onSubmit={methods.onSubmit} method="post">
        <label htmlFor="title">Title:</label>
        <br />
        <input
          id="title"
          type="text"
          disabled={addPost.isLoading}
          {...methods.form.register('title')}
        />

        <br />
        <label htmlFor="text">Text:</label>
        <br />
        <textarea
          id="text"
          disabled={addPost.isLoading}
          {...methods.form.register('text')}
        />
        <br />
        <input type="submit" disabled={addPost.isLoading} />
        {addPost.error && (
          <p style={{ color: 'red' }}>{addPost.error.message}</p>
        )}
      </form>
    </>
  );
};

export default IndexPage;

/**
 * If you want to statically render this page
 * - Export `appRouter` & `createContext` from [trpc].ts
 * - Make the `opts` object optional on `createContext()`
 *
 * @link https://trpc.io/docs/ssg
 */
// export const getStaticProps = async (
//   context: GetStaticPropsContext<{ filter: string }>,
// ) => {
//   const ssg = createSSGHelpers({
//     router: appRouter,
//     ctx: await createContext(),
//   });
//
//   await ssg.fetchQuery('post.all');
//
//   return {
//     props: {
//       trpcState: ssg.dehydrate(),
//       filter: context.params?.filter ?? 'all',
//     },
//     revalidate: 1,
//   };
// };
