import { useState } from 'react';
import { 
  TextInput, 
  PasswordInput, 
  Button, 
  Title, 
  Text,
  Tabs, 
  Paper, 
  Checkbox, 
  Anchor, 
  Stack, 
  Container, 
  Group 
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { authClient } from '@/lib/auth-client';
import { notifications } from '@mantine/notifications';
import { useRouter } from '@tanstack/react-router';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/')({
  component: Auth,
})


function Auth() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('signin');
  const router = useRouter();
  
  // Sign In Form
  const signInForm = useForm({
    initialValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
    validate: {
      email: (value: string) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value: string) => (value.length >= 8 ? null : 'Password must be at least 8 characters'),
    },
  });

  // Sign Up Form
  const signUpForm = useForm({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
    },
    validate: {
      email: (value: string) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value: string) => {
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (value.length > 32) return 'Password must be at most 32 characters';
        return null;
      },
      confirmPassword: (value: string, values: { password: string }) => 
        value !== values.password ? 'Passwords do not match' : null,
      name: (value: string) => (value.trim().length > 0 ? null : 'Name is required'),
    },
  });

  const handleSignIn = async (values: typeof signInForm.values) => {
    try {
      setLoading(true);
      const { error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe,
      });

      if (error) {
        notifications.show({
          title: 'Authentication failed',
          message: error.message || 'Failed to sign in. Please check your credentials.',
          color: 'red',
        });
        return;
      }

      notifications.show({
        title: 'Welcome back!',
        message: 'You have successfully signed in.',
        color: 'green',
      });
      
      // Redirect to dashboard or home page
      router.navigate({ to: '/dashboard' });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'An unexpected error occurred. Please try again.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (values: typeof signUpForm.values) => {
    try {
      setLoading(true);
      const { error } = await authClient.signUp.email({
        email: values.email,
        password: values.password,
        name: values.name,
      });

      if (error) {
        notifications.show({
          title: 'Registration failed',
          message: error.message || 'Failed to create account. Please try again.',
          color: 'red',
        });
        return;
      }

      notifications.show({
        title: 'Account created',
        message: 'Your account has been successfully created. You can now sign in.',
        color: 'green',
      });
      
      // Switch to sign in tab
      setActiveTab('signin');
      signInForm.setValues({
        email: values.email,
        password: '',
        rememberMe: true,
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'An unexpected error occurred. Please try again.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xs" py="xl">
      <Paper radius="md" p="xl" withBorder>
        <Title ta="center" order={2} mb="lg">
          Welcome to Viper
        </Title>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List grow mb="md">
            <Tabs.Tab value="signin">Sign In</Tabs.Tab>
            <Tabs.Tab value="signup">Sign Up</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="signin">
            <form onSubmit={signInForm.onSubmit(handleSignIn)}>
              <Stack>
                <TextInput
                  required
                  label="Email"
                  placeholder="your@email.com"
                  {...signInForm.getInputProps('email')}
                />

                <PasswordInput
                  required
                  label="Password"
                  placeholder="Your password"
                  {...signInForm.getInputProps('password')}
                />

                <Group justify="space-between">
                  <Checkbox
                    label="Remember me"
                    {...signInForm.getInputProps('rememberMe', { type: 'checkbox' })}
                  />
                  <Anchor size="sm" href="#">
                    Forgot password?
                  </Anchor>
                </Group>

                <Button type="submit" loading={loading} fullWidth>
                  Sign In
                </Button>
              </Stack>
            </form>
          </Tabs.Panel>

          <Tabs.Panel value="signup">
            <form onSubmit={signUpForm.onSubmit(handleSignUp)}>
              <Stack>
                <TextInput
                  required
                  label="Name"
                  placeholder="Your name"
                  {...signUpForm.getInputProps('name')}
                />

                <TextInput
                  required
                  label="Email"
                  placeholder="your@email.com"
                  {...signUpForm.getInputProps('email')}
                />

                <PasswordInput
                  required
                  label="Password"
                  placeholder="Create a password"
                  {...signUpForm.getInputProps('password')}
                />

                <PasswordInput
                  required
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  {...signUpForm.getInputProps('confirmPassword')}
                />

                <Button type="submit" loading={loading} fullWidth>
                  Create Account
                </Button>
              </Stack>
            </form>
          </Tabs.Panel>
        </Tabs>

        <Text size="sm" ta="center" mt="md">
          {activeTab === 'signin' ? (
            <>
              Don't have an account?{' '}
              <Anchor onClick={() => setActiveTab('signup')}>
                Create one
              </Anchor>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Anchor onClick={() => setActiveTab('signin')}>
                Sign in
              </Anchor>
            </>
          )}
        </Text>
      </Paper>
    </Container>
  );
}
