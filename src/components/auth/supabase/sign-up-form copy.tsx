'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Controller, useForm } from 'react-hook-form';
import { z as zod } from 'zod';

import { paths } from '@/paths';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';

const schema = zod.object({
  firstName: zod.string().min(1, { message: 'First name is required' }),
  lastName: zod.string().min(1, { message: 'Last name is required' }),
  email: zod.string().min(1, { message: 'Email is required' }).email(),
  password: zod.string().min(6, { message: 'Password should be at least 6 characters' }),
  terms: zod.boolean().refine((value) => value, 'You must accept the terms and conditions'),
});

type Values = zod.infer<typeof schema>;

const defaultValues = { firstName: '', lastName: '', email: '', password: '', terms: false } satisfies Values;

export function SignUpForm(): React.JSX.Element {
  const [supabaseClient] = React.useState<SupabaseClient>(createSupabaseClient());

  const router = useRouter();

  const [isPending, setIsPending] = React.useState<boolean>(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({ defaultValues, resolver: zodResolver(schema) });

  const onSubmit = React.useCallback(
    async (values: Values): Promise<void> => {
      setIsPending(true);

      // It is really important that you read the official notes
      // under "If signUp() is called for an existing confirmed user"
      // https://supabase.com/docs/reference/javascript/auth-signup
      // If a user already exists with this email, they will not
      // receive a confirmation email.

      const redirectToUrl = new URL(paths.auth.supabase.callback.pkce, window.location.origin);
      redirectToUrl.searchParams.set('next', paths.dashboard.overview);

      const { data, error } = await supabaseClient.auth.signUp({
        email: values.email,
        password: values.password,
        options: { emailRedirectTo: redirectToUrl.href },
      });

      if (error) {
        setError('root', { type: 'server', message: error.message });
        setIsPending(false);
        return;
      }

      if (data.session) {
        // UserProvider will handle Router refresh
        // After refresh, GuestGuard will handle the redirect
        return;
      }

      if (data.user) {
        const searchParams = new URLSearchParams({ email: values.email });
        router.push(`${paths.auth.supabase.signUpConfirm}?${searchParams.toString()}`);
        return;
      }

      setIsPending(false);
    },
    [supabaseClient, router, setError]
  );

  return (
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Typography variant="h5">Sign up</Typography>
        <Typography color="text.secondary" variant="body2">
          Already have an account?{' '}
          <Link component={RouterLink} href={paths.auth.supabase.signIn} variant="subtitle2" sx={{ color: '#52CAB1' }}>
            Sign in
          </Link>
        </Typography>
      </Stack>
      <Stack spacing={3}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2}>
            <Controller
              control={control}
              name="firstName"
              render={({ field }) => (
                <FormControl error={Boolean(errors.firstName)}>
                  <InputLabel>First name</InputLabel>
                  <OutlinedInput {...field} />
                  {errors.firstName ? <FormHelperText>{errors.firstName.message}</FormHelperText> : null}
                </FormControl>
              )}
            />
            <Controller
              control={control}
              name="lastName"
              render={({ field }) => (
                <FormControl error={Boolean(errors.lastName)}>
                  <InputLabel>Last name</InputLabel>
                  <OutlinedInput {...field} />
                  {errors.lastName ? <FormHelperText>{errors.lastName.message}</FormHelperText> : null}
                </FormControl>
              )}
            />
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <FormControl error={Boolean(errors.email)}>
                  <InputLabel>Email address</InputLabel>
                  <OutlinedInput {...field} type="email" />
                  {errors.email ? <FormHelperText>{errors.email.message}</FormHelperText> : null}
                </FormControl>
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <FormControl error={Boolean(errors.password)}>
                  <InputLabel>Password</InputLabel>
                  <OutlinedInput {...field} type="password" />
                  {errors.password ? <FormHelperText>{errors.password.message}</FormHelperText> : null}
                </FormControl>
              )}
            />
            <Controller
              control={control}
              name="terms"
              render={({ field }) => (
                <div>
                  <FormControlLabel
                    control={<Checkbox {...field} />}
                    label={
                      <React.Fragment>
                        I have read the <Link sx={{ color: '#52CAB1' }}>terms and conditions</Link>
                      </React.Fragment>
                    }
                  />
                  {errors.terms ? <FormHelperText error>{errors.terms.message}</FormHelperText> : null}
                </div>
              )}
            />
            {errors.root ? <Alert color="error">{errors.root.message}</Alert> : null}
            <Button disabled={isPending} type="submit" sx={{ backgroundColor: '#52CAB1', color: '#ffffff' }}>
              Create account
            </Button>
          </Stack>
        </form>
      </Stack>
    </Stack>
  );
}
