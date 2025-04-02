import { useState, useEffect, useCallback } from "react";
import { 
  Box, 
  Title, 
  Text, 
  Button, 
  TextInput, 
  Group, 
  Loader, 
  Divider, 
  Card, 
  SimpleGrid, 
  ActionIcon, 
  Menu, 
  Modal, 
  Stack, 
  Flex, 
  Tabs, 
  Badge,
  CopyButton,
  Select,
  Paper,
  Center,
  Container,
  Image
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { authClient } from "../../lib/auth-client";
import { notifications } from "@mantine/notifications";
import { 
  IconPlus, 
  IconCheck, 
  IconX, 
  IconEdit, 
  IconTrash, 
  IconDotsVertical, 
  IconUserPlus, 
  IconCopy, 
  IconSend, 
  IconBan,
  IconTicket,
  IconAlertTriangle,
  IconRefresh
} from '@tabler/icons-react';
import { useDisclosure } from "@mantine/hooks";
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/orgs/')({
  component: Orgs,
})


// Define the role type to match the API's expected values
type OrganizationRole = "admin" | "member" | "owner";

// Define the API organization type based on what's returned from the API
interface ApiOrganization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  metadata?: {
    customerId?: string;
    [key: string]: string | undefined;
  };
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  metadata?: {
    customerId?: string;
    [key: string]: string | undefined;
  };
}

interface Invitation {
  id: string;
  email: string;
  role: OrganizationRole | OrganizationRole[];
  status: string;
  organizationId: string;
}

function Orgs() {
  const [isCreating, setIsCreating] = useState(false);
  const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [invitationCode, setInvitationCode] = useState<string>("");
  const [clientLoaded, setClientLoaded] = useState(false);
  const { data: organizations = [], isPending } = authClient.useListOrganizations();
  
  // Modal states
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [inviteModalOpened, { open: openInviteModal, close: closeInviteModal }] = useDisclosure(false);
  const [useInviteModalOpened, { open: openUseInviteModal, close: closeUseInviteModal }] = useDisclosure(false);

  const form = useForm({
    initialValues: {
      name: "",
      slug: "",
      logo: "",
    },
    validate: {
      name: (value: string) => (value.length < 2 ? "Name must be at least 2 characters" : null),
      slug: (value: string) => {
        if (value.length < 2) return "Slug must be at least 2 characters";
        if (!/^[a-z0-9-]+$/.test(value)) return "Slug can only contain lowercase letters, numbers, and hyphens";
        if (isSlugAvailable === false) return "This slug is already taken";
        return null;
      },
      logo: (value: string) => (value && !value.startsWith("http") ? "Logo must be a valid URL" : null),
    },
  });

  const editForm = useForm({
    initialValues: {
      name: "",
      slug: "",
      logo: "",
      customerId: "",
    },
    validate: {
      name: (value: string) => (value.length < 2 ? "Name must be at least 2 characters" : null),
      slug: (value: string) => {
        if (value.length < 2) return "Slug must be at least 2 characters";
        if (!/^[a-z0-9-]+$/.test(value)) return "Slug can only contain lowercase letters, numbers, and hyphens";
        return null;
      },
      logo: (value: string) => (value && !value.startsWith("http") ? "Logo must be a valid URL" : null),
    },
  });

  const inviteForm = useForm({
    initialValues: {
      email: "",
      role: "member" as OrganizationRole,
    },
    validate: {
      email: (value: string) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      role: (value: string) => (!value ? "Role is required" : null),
    },
  });

  const useInviteForm = useForm({
    initialValues: {
      invitationId: "",
    },
    validate: {
      invitationId: (value: string) => (!value ? "Invitation code is required" : null),
    },
  });

  const checkSlug = useCallback(async (slug: string) => {
    if (!slug || slug.length < 2 || !/^[a-z0-9-]+$/.test(slug)) {
      setIsSlugAvailable(null);
      return;
    }

    setIsCheckingSlug(true);
    
    try {
      // Check if the slug is available
      const response = await authClient.organization.checkSlug({ slug });
      
      // Debug the actual response
      console.log("Slug check response:", response);
      
      // Check the response structure based on the actual format observed
      if (response && 'error' in response && response.error) {
        const { error } = response;
        
        if (error.code === 'SLUG_IS_TAKEN' && error.message === 'slug is taken') {
          // Slug is taken
          setIsSlugAvailable(false);
        } else {
          // Some other error
          console.error("Unexpected error in response:", error);
          setIsSlugAvailable(null);
        }
      } else if (response && 'data' in response && response.data === null && !('error' in response)) {
        // Success response with null data and no error - slug is available
        setIsSlugAvailable(true);
      } else if (response && 'data' in response && response.data && 'status' in response.data && response.data.status === true) {
        // Success response with {data: {status: true}, error: null}
        setIsSlugAvailable(true);
      } else if ('status' in response && response.status === true) {
        // Alternative success format
        setIsSlugAvailable(true);
      } else {
        // Unexpected response format
        console.error("Unexpected response format checking slug:", response);
        setIsSlugAvailable(null);
      }
    } catch (error: unknown) {
      // Handle any unexpected errors (network issues, etc.)
      console.error("Error checking slug availability:", error);
      setIsSlugAvailable(null);
    } finally {
      setIsCheckingSlug(false);
    }
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (form.values.slug) {
        checkSlug(form.values.slug);
      } else {
        // Clear the availability state if there's no slug
        setIsSlugAvailable(null);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [form.values.slug, checkSlug]);

  useEffect(() => {
    // Set clientLoaded to true after component mounts (client-side only)
    setClientLoaded(true);
  }, []);

  const handleCreateOrg = async (values: typeof form.values) => {
    // Extra validation check before attempting to create
    if (isSlugAvailable === false || isSlugAvailable === null) {
      // Force another check just to be sure
      await checkSlug(values.slug);
      
      if (isSlugAvailable === false) {
        notifications.show({
          title: "Error",
          message: "Please use a different slug. This one may already be taken.",
          color: "red",
        });
        return;
      }
    }
    
    try {
      const response = await authClient.organization.create({
        name: values.name,
        slug: values.slug,
        logo: values.logo || undefined,
      });
      
      // Log response for debugging
      console.log("Create org response:", response);
      
      // Check if the response contains an error
      if (response && 'error' in response && response.error) {
        // Handle error response
        const errorStatus = response.error.status || 500;
        const errorText = response.error.statusText || "Unknown error";
        
        console.error(`Error creating organization: ${errorStatus} - ${errorText}`);
        
        notifications.show({
          title: "⚠️ Error Creating Organization",
          message: `Failed to create organization: ${errorText}`,
          color: "orange",
          autoClose: false,
          withCloseButton: true,
          icon: <IconAlertTriangle />,
        });
      } else {
        // Success case - organization was created
        setIsCreating(false);
        form.reset();
        setIsSlugAvailable(null); // Reset slug availability state
        
        notifications.show({
          title: "Success",
          message: "Organization created successfully",
          color: "green",
        });
      }
    } catch (error: unknown) {
      console.error("Create org error:", error);
      
      // Handle the nested error structure
      type ErrorResponse = {
        error?: {
          code?: string;
          message?: string;
          status?: number;
          statusText?: string;
        };
        data?: null | unknown;
      };
      
      const errorResponse = error as ErrorResponse;
      
      // Check if we have a nested error with the SLUG_IS_TAKEN code
      if (
        errorResponse && 
        'error' in errorResponse && 
        errorResponse.error && 
        errorResponse.error.code === 'SLUG_IS_TAKEN' && 
        errorResponse.error.message === 'slug is taken'
      ) {
        setIsSlugAvailable(false);
        notifications.show({
          title: "Error",
          message: "This organization slug is already taken. Please choose another one.",
          color: "red",
        });
      } 
      // Handle server error response format: {data: null, error: {status: 500, statusText: "Internal Server Error"}}
      else if (
        errorResponse && 
        'error' in errorResponse && 
        errorResponse.error && 
        errorResponse.error.status === 500
      ) {
        const statusText = errorResponse.error.statusText || "Unknown server error";
        notifications.show({
          title: "⚠️ Server Error",
          message: `Failed to create organization due to a server error (${statusText}). Please try again later or contact support if the issue persists.`,
          color: "orange",
          autoClose: false,
          withCloseButton: true,
          icon: <IconAlertTriangle />,
        });
      }
      else {
        // Generic error handling
        const errorMessage = (error as Error)?.message || "Unknown error";
        notifications.show({
          title: "Error",
          message: `Failed to create organization: ${errorMessage}`,
          color: "red",
        });
      }
    }
  };

  const handleUpdateOrg = async (values: typeof editForm.values) => {
    if (!selectedOrg) return;
    
    try {
      await authClient.organization.update({
        data: {
          name: values.name,
          slug: values.slug,
          logo: values.logo || undefined,
          metadata: {
            customerId: values.customerId
          }
        },
        organizationId: selectedOrg.id
      });
      
      closeEditModal();
      editForm.reset();
      notifications.show({
        title: "Success",
        message: "Organization updated successfully",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to update organization",
        color: "red",
      });
    }
  };

  const handleDeleteOrg = async () => {
    if (!selectedOrg) return;
    
    try {
      await authClient.organization.delete({
        organizationId: selectedOrg.id
      });
      
      closeDeleteModal();
      notifications.show({
        title: "Success",
        message: "Organization deleted successfully",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to delete organization",
        color: "red",
      });
    }
  };

  const handleInviteMember = async (values: typeof inviteForm.values) => {
    try {
      const response = await authClient.organization.inviteMember({
        email: values.email,
        role: values.role,
      });
      
      // In a real app, this would be sent via email
      // For now, we'll display the invitation code
      // Check if response exists and has data property with id
      if (response && 'data' in response && response.data && response.data.id) {
        setInvitationCode(response.data.id);
      }
      
      inviteForm.reset();
      notifications.show({
        title: "Success",
        message: "Invitation created successfully",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to create invitation",
        color: "red",
      });
    }
  };

  const handleAcceptInvitation = async (values: typeof useInviteForm.values) => {
    try {
      await authClient.organization.acceptInvitation({
        invitationId: values.invitationId
      });
      
      closeUseInviteModal();
      useInviteForm.reset();
      notifications.show({
        title: "Success",
        message: "Invitation accepted successfully",
        color: "green",
      });
      
      // Refresh the page to show the new organization
      window.location.reload();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to accept invitation",
        color: "red",
      });
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await authClient.organization.cancelInvitation({
        invitationId
      });
      
      // Update invitations list
      setInvitations(invitations.filter(inv => inv.id !== invitationId));
      
      notifications.show({
        title: "Success",
        message: "Invitation cancelled successfully",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to cancel invitation",
        color: "red",
      });
    }
  };

  const setActiveOrg = async (orgSlug: string) => {
    try {
      await authClient.organization.setActive({
        organizationSlug: orgSlug,
      });
      
      notifications.show({
        title: "Success",
        message: "Active organization changed",
        color: "green",
      });
      
      // Redirect to dashboard or refresh the page
      window.location.href = "/dashboard";
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to change active organization",
        color: "red",
      });
    }
  };

  const openOrgSettings = (org: ApiOrganization) => {
    // Convert the API organization object to our Organization type
    const organization: Organization = {
      id: org.id,
      name: org.name,
      slug: org.slug,
      logo: org.logo || null,
      metadata: org.metadata
    };
    
    setSelectedOrg(organization);
    editForm.setValues({
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo || "",
      customerId: organization.metadata?.customerId || "",
    });
    openEditModal();
  };

  const openOrgDelete = (org: ApiOrganization) => {
    // Convert the API organization object to our Organization type
    const organization: Organization = {
      id: org.id,
      name: org.name,
      slug: org.slug,
      logo: org.logo || null,
      metadata: org.metadata
    };
    
    setSelectedOrg(organization);
    openDeleteModal();
  };

  const openOrgInvite = (org: ApiOrganization) => {
    // Convert the API organization object to our Organization type
    const organization: Organization = {
      id: org.id,
      name: org.name,
      slug: org.slug,
      logo: org.logo || null,
      metadata: org.metadata
    };
    
    setSelectedOrg(organization);
    openInviteModal();
  };

  if (!clientLoaded) {
    // Initial server render - render a consistent skeleton to avoid hydration mismatch
    return (
      <Box py="xl">
        <Title order={1} mb="xl">Organizations</Title>
      </Box>
    );
  }

  if (isPending && clientLoaded) {
    return (
      <Box py="xl">
        <Center h="100vh">
          <Loader size="xl" />
        </Center>
      </Box>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Box mb="xl">
        <Flex justify="space-between" align="center" mb="md">
          <Title order={1}>Organizations</Title>
          <Group justify="right">
            <Button 
              variant="light"
              leftSection={<IconTicket size={16} />} 
              onClick={() => openUseInviteModal()}
            >
              Use Invitation Code
            </Button>
            {!isCreating && (
              <Button 
                leftSection={<IconPlus size={16} />} 
                onClick={() => setIsCreating(true)}
              >
                Create Organization
              </Button>
            )}
          </Group>
        </Flex>
        <Text c="dimmed">Select an organization or create a new one to get started.</Text>
      </Box>

      {isCreating ? (
        <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
          <Title order={3} mb="md">Create New Organization</Title>
          <form onSubmit={form.onSubmit(handleCreateOrg)}>
            <Stack>
              <TextInput
                label="Organization Name"
                placeholder="My Organization"
                required
                {...form.getInputProps("name")}
              />
              
              <TextInput
                label="Organization Slug"
                placeholder="my-org"
                description="A unique identifier for your organization. Used in URLs."
                required
                rightSection={
                  isCheckingSlug ? (
                    <Loader size="xs" />
                  ) : isSlugAvailable === true ? (
                    <IconCheck size={16} color="green" />
                  ) : isSlugAvailable === false ? (
                    <IconX size={16} color="red" />
                  ) : null
                }
                {...form.getInputProps("slug")}
              />
              
              <TextInput
                label="Logo URL (Optional)"
                placeholder="https://example.com/logo.png"
                {...form.getInputProps("logo")}
              />
              
              <Group justify="right" mt="md">
                <Button variant="light" onClick={() => {
                  setIsCreating(false);
                  form.reset();
                  setIsSlugAvailable(null); // Reset slug availability state
                }}>
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSlugAvailable === false || isCheckingSlug || form.values.slug.length < 2}
                  loading={isCheckingSlug}
                >
                  Create Organization
                </Button>
              </Group>
            </Stack>
          </form>
        </Card>
      ) : null}

      {Array.isArray(organizations) && organizations.length > 0 ? (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {organizations.map((org) => (
            <Card 
              key={org.id} 
              shadow="sm" 
              padding="lg" 
              radius="md" 
              withBorder
              style={{ cursor: "pointer", position: "relative" }}
            >
              <Menu position="top-end" withinPortal>
                <Menu.Target>
                  <ActionIcon 
                    style={{ position: "absolute", top: 10, right: 10, zIndex: 10 }}
                    variant="subtle"
                  >
                    <IconDotsVertical size={16} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item 
                    leftSection={<IconEdit size={14} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      openOrgSettings(org);
                    }}
                  >
                    Edit Organization
                  </Menu.Item>
                  <Menu.Item 
                    leftSection={<IconUserPlus size={14} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      openOrgInvite(org);
                    }}
                  >
                    Invite Members
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item 
                    color="red" 
                    leftSection={<IconTrash size={14} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      openOrgDelete(org);
                    }}
                  >
                    Delete Organization
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>

              <Card.Section p="md" onClick={() => setActiveOrg(org.slug)}>
                {org.logo ? (
                  <Image
                    src={org.logo}
                    height={160}
                    alt={org.name}
                    fallbackSrc="https://placehold.co/400x200?text=No+Logo"
                  />
                ) : (
                  <Center h={160} bg="gray.1">
                    <Text fw={500} c="dimmed">{org.name.substring(0, 2).toUpperCase()}</Text>
                  </Center>
                )}
              </Card.Section>

              <Stack mt="md" mb="xs" onClick={() => setActiveOrg(org.slug)}>
                <Text fw={500}>{org.name}</Text>
                <Text size="sm" c="dimmed">
                  {org.slug}
                </Text>
              </Stack>

              <Button 
                variant="light" 
                color="blue" 
                fullWidth 
                mt="md" 
                radius="md"
                onClick={() => setActiveOrg(org.slug)}
              >
                Select Organization
              </Button>
            </Card>
          ))}
        </SimpleGrid>
      ) : (
        <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
          <Stack align="center" gap="md" py="xl">
            {isPending ? (
              <Loader size="md" />
            ) : (
              <>
                <IconAlertTriangle size={48} color="orange" />
                <Title order={3} ta="center">No Organizations Available</Title>
                <Text c="dimmed" ta="center">
                  {Array.isArray(organizations) 
                    ? "You don't have any organizations yet. Create one to get started."
                    : "Unable to load organizations. There might be a connection issue with the server."}
                </Text>
                {!Array.isArray(organizations) && (
                  <Button 
                    variant="light" 
                    onClick={() => window.location.reload()}
                    leftSection={<IconRefresh size={16} />}
                  >
                    Retry
                  </Button>
                )}
              </>
            )}
          </Stack>
        </Card>
      )}
      {/* Edit Organization Modal */}
      <Modal 
        opened={editModalOpened} 
        onClose={closeEditModal} 
        title="Organization Settings" 
        size="lg"
      >
        {selectedOrg && (
          <Tabs defaultValue="details">
            <Tabs.List mb="md">
              <Tabs.Tab value="details">Organization Details</Tabs.Tab>
              <Tabs.Tab value="members">Members & Invitations</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="details">
              <form onSubmit={editForm.onSubmit(handleUpdateOrg)}>
                <Stack>
                  <TextInput
                    label="Organization Name"
                    placeholder="My Organization"
                    required
                    {...editForm.getInputProps("name")}
                  />
                  
                  <TextInput
                    label="Organization Slug"
                    placeholder="my-org"
                    required
                    {...editForm.getInputProps("slug")}
                  />
                  
                  <TextInput
                    label="Logo URL (Optional)"
                    placeholder="https://example.com/logo.png"
                    {...editForm.getInputProps("logo")}
                  />
                  
                  <TextInput
                    label="Customer ID (Optional)"
                    placeholder="External customer ID"
                    {...editForm.getInputProps("customerId")}
                  />
                  
                  <Group justify="right" mt="md">
                    <Button variant="light" onClick={closeEditModal}>
                      Cancel
                    </Button>
                    <Button type="submit">Save Changes</Button>
                  </Group>
                </Stack>
              </form>
            </Tabs.Panel>

            <Tabs.Panel value="members">
              <Stack>
                <Group justify="apart">
                  <Title order={4}>Members</Title>
                  <Button 
                    leftSection={<IconUserPlus size={16} />} 
                    variant="light"
                    onClick={() => openOrgInvite(selectedOrg)}
                  >
                    Invite Member
                  </Button>
                </Group>
                
                {/* Member list would go here */}
                <Text c="dimmed">Member management functionality coming soon.</Text>
                
                <Divider my="md" />
                
                <Title order={4}>Pending Invitations</Title>
                {invitations.length > 0 ? (
                  <Stack>
                    {invitations.map((invitation) => (
                      <Paper key={invitation.id} p="md" withBorder>
                        <Group justify="apart">
                          <div>
                            <Text>{invitation.email}</Text>
                            <Group>
                              <Badge>
                                {Array.isArray(invitation.role) 
                                  ? invitation.role.join(", ") 
                                  : invitation.role}
                              </Badge>
                              <Badge color={invitation.status === "pending" ? "yellow" : "green"}>
                                {invitation.status}
                              </Badge>
                            </Group>
                          </div>
                          <Group>
                            <CopyButton value={invitation.id}>
                              {({ copied, copy }) => (
                                <Button 
                                  variant="subtle" 
                                  leftSection={<IconCopy size={16} />}
                                  color={copied ? "teal" : "blue"}
                                  onClick={copy}
                                >
                                  {copied ? "Copied" : "Copy Code"}
                                </Button>
                              )}
                            </CopyButton>
                            <Button 
                              variant="subtle" 
                              color="red"
                              leftSection={<IconBan size={16} />}
                              onClick={() => handleCancelInvitation(invitation.id)}
                            >
                              Cancel
                            </Button>
                          </Group>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Text c="dimmed">No pending invitations</Text>
                )}
              </Stack>
            </Tabs.Panel>
          </Tabs>
        )}
      </Modal>

      {/* Delete Organization Modal */}
      <Modal 
        opened={deleteModalOpened} 
        onClose={closeDeleteModal} 
        title="Delete Organization" 
        centered
      >
        {selectedOrg?.name && (
          <Stack>
            <Text>Are you sure you want to delete <strong>{selectedOrg.name}</strong>?</Text>
            <Text c="dimmed" size="sm">This action cannot be undone. All data associated with this organization will be permanently deleted.</Text>
            
            <Group justify="right" mt="xl">
              <Button variant="light" onClick={closeDeleteModal}>
                Cancel
              </Button>
              <Button color="red" onClick={handleDeleteOrg}>
                Delete Organization
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Invite Member Modal */}
      <Modal 
        opened={inviteModalOpened} 
        onClose={closeInviteModal} 
        title="Invite Member" 
        centered
      >
        {selectedOrg?.name && (
          <Stack>
            <Text>Invite a new member to <strong>{selectedOrg.name}</strong></Text>
            
            <form onSubmit={inviteForm.onSubmit(handleInviteMember)}>
              <Stack>
                <TextInput
                  label="Email"
                  placeholder="user@example.com"
                  required
                  {...inviteForm.getInputProps("email")}
                />
                
                <Select
                  label="Role"
                  placeholder="Select a role"
                  data={[
                    { value: "admin", label: "Admin" },
                    { value: "member", label: "Member" },
                    { value: "owner", label: "Owner" },
                  ]}
                  required
                  {...inviteForm.getInputProps("role")}
                />
                
                {invitationCode && (
                  <Paper p="md" withBorder>
                    <Stack>
                      <Group>
                        <Text fw={500}>Invitation Code:</Text>
                        <Text>{invitationCode}</Text>
                      </Group>
                      <Text size="sm" c="dimmed">
                        Share this code with the user. They can use it to join your organization.
                      </Text>
                      <CopyButton value={invitationCode}>
                        {({ copied, copy }) => (
                          <Button 
                            variant="light" 
                            leftSection={<IconCopy size={16} />}
                            color={copied ? "teal" : "blue"}
                            onClick={copy}
                            fullWidth
                          >
                            {copied ? "Copied" : "Copy Invitation Code"}
                          </Button>
                        )}
                      </CopyButton>
                    </Stack>
                  </Paper>
                )}
                
                <Group justify="right" mt="md">
                  <Button variant="light" onClick={closeInviteModal}>
                    Cancel
                  </Button>
                  <Button type="submit" leftSection={<IconSend size={16} />}>
                    Send Invitation
                  </Button>
                </Group>
              </Stack>
            </form>
          </Stack>
        )}
      </Modal>

      {/* Use Invitation Code Modal */}
      <Modal 
        opened={useInviteModalOpened} 
        onClose={closeUseInviteModal} 
        title="Join Organization" 
        centered
      >
        <Stack>
          <Text>Enter an invitation code to join an organization</Text>
          
          <form onSubmit={useInviteForm.onSubmit(handleAcceptInvitation)}>
            <Stack>
              <TextInput
                label="Invitation Code"
                placeholder="Enter invitation code"
                required
                {...useInviteForm.getInputProps("invitationId")}
              />
              
              <Group justify="right" mt="md">
                <Button variant="light" onClick={closeUseInviteModal}>
                  Cancel
                </Button>
                <Button type="submit">
                  Join Organization
                </Button>
              </Group>
            </Stack>
          </form>
        </Stack>
      </Modal>
    </Container>
  );
}
