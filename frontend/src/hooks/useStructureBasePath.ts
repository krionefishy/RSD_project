import { useLocation } from "react-router";

export function useStructureBasePath() {
  const location = useLocation();
  const isSuperAdmin = location.pathname.startsWith("/superadmin");
  const isManager = location.pathname.startsWith("/manager");

  if (isSuperAdmin) {
    return {
      blocks: "/superadmin/structure",
      locations: "/superadmin/structure/locations",
      block: (id: string) => `/superadmin/structure/blocks/${id}`,
      location: (id: string) => `/superadmin/structure/locations/${id}`,
      employee: (id: string) => `/admin-personnel/manage/${id}`,
    };
  }

  if (isManager) {
    return {
      blocks: "/manager",
      locations: "/manager/locations",
      block: (_id: string) => `/manager`,
      location: (id: string) => `/manager/locations/${id}`,
      employee: (id: string) => `/manager/employees/${id}`,
    };
  }

  return {
    blocks: "/admin-personnel/blocks",
    locations: "/admin-personnel/locations",
    block: (id: string) => `/admin-personnel/blocks/${id}`,
    location: (id: string) => `/admin-personnel/locations/${id}`,
    employee: (id: string) => `/admin-personnel/manage/${id}`,
  };
}
