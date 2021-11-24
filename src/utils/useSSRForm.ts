import { IncomingMessage } from 'http';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import { AppRouter } from 'server/routers/_app';
import { inferMutationInput, trpc } from './trpc';

export async function getPostBody(req: IncomingMessage) {
  return new Promise<{ data: unknown }>((resolve) => {
    let body = '';
    let hasBody = false;
    req.on('data', function (data: unknown) {
      body += data;
      hasBody = true;
    });
    req.on('end', () => {
      resolve({
        data: hasBody ? body : undefined,
      });
    });
  });
}

export function useSSRForm<
  TPath extends keyof AppRouter['_def']['mutations'] & string,
>(path: TPath) {
  type TInput = inferMutationInput<TPath>;
  const form = useForm<TInput>();
  const utils = trpc.useContext();
  const mutation = trpc.useMutation(path, {
    onSuccess() {
      // invalidate all queries on mutation
      utils.queryClient.clear();
    },
  });
  const req = utils.ssrContext?.req;
  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate(values);
    form.reset();
  });

  const ssrMutation = useMutation(path + '__mutation', async () => {
    const res = await getPostBody(req!);
    if (typeof res.data !== 'string') {
      throw new Error('Expected string');
    }
    const data = JSON.parse(
      '{"' +
        decodeURI(res.data as any)
          .replace(/"/g, '\\"')
          .replace(/&/g, '","')
          .replace(/=/g, '":"') +
        '"}',
    );
    mutation.mutate(data);
  });
  const result = {
    form,
    onSubmit,
  };
  if (req && req.method === 'POST') {
    // we've received a POST
    const set: Set<string> = ((req as any).__trpc =
      (req as any).__trpc ?? new Set<string>());

    // make sure post is only executed once
    if (set.has(path)) {
      return result;
    }
    set.add(path);
    ssrMutation.mutate();
  }
  return result;
}
