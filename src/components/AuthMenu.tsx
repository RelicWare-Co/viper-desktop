import { authClient } from "@/lib/auth-client";
import { Avatar, Group, Menu, UnstyledButton, Text, Button } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";

function AuthMenu() {
    const { data } = authClient.useSession();
    const navigate = useNavigate();
    
    if (!data || !data.user) {
        return (
            <Button 
                onClick={() => navigate({ to: "/auth" })}
                variant="light"
            >
                Login
            </Button>
        );
    }
    
    return (
        <Menu shadow="md" offset={0} transitionProps={{ transition: 'rotate-right', duration: 150 }}>
            <Menu.Target>
            <UnstyledButton
      style={{
        color: 'var(--mantine-color-text)',
        borderRadius: 'var(--mantine-radius-sm)',
      }}
    >
      <Group>
        <Avatar radius="xl">
            {data.user.name ? data.user.name.slice(0,1) : '?'}
        </Avatar>

        <div style={{ flex: 1 }}>
          <Text size="sm" fw={500}>
            {data.user.name || 'User'}
          </Text>

          <Text c="dimmed" size="xs">
            {data.user.email || 'No email'}
          </Text>
        </div>

      </Group>
    </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
            <Menu.Label>Session</Menu.Label>
            <Menu.Item onClick={async () => {
                try {
                    await authClient.signOut();
                    navigate({ to: "/" });
                } catch (error) {
                    console.error("Error signing out:", error);
                }
            }}>
                Sign out
            </Menu.Item>
            </Menu.Dropdown>

        </Menu>
    )
}

export default AuthMenu;