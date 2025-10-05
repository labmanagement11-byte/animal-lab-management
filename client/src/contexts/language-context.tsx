import { createContext, useContext, useEffect, useState } from "react";

type Language = "en" | "es";

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: typeof translations.en;
}

const translations = {
  en: {
    // Navigation
    nav: {
      dashboard: "Dashboard",
      animals: "Animals",
      cages: "Cages",
      strains: "Strains",
      reports: "Reports",
      trash: "Trash",
      users: "User Management",
      admin: "Admin Panel",
      blankQr: "Generate Blank QR",
      qrScanner: "QR Scanner",
      menu: "Menu",
      labManagement: "Lab Management",
      labManager: "Lab Manager",
    },
    // Common Actions
    actions: {
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      view: "View",
      add: "Add",
      close: "Close",
      search: "Search",
      download: "Download",
      print: "Print",
      copy: "Copy",
      restore: "Restore",
      signOut: "Sign Out",
      update: "Update",
      invite: "Invite",
      activate: "Activate",
      unblock: "Unblock",
      block: "Block",
      startScanner: "Start Scanner",
      stopScanner: "Stop Scanner",
      viewFullRecord: "View Full Record",
      clearData: "Clear Data",
      scanAnother: "Scan Another QR",
      backTo: "Back to",
    },
    // Theme
    theme: {
      lightMode: "Light Mode",
      darkMode: "Dark Mode",
      language: "Language",
      english: "English",
      spanish: "Spanish",
    },
    // Authentication
    auth: {
      signIn: "Sign In",
      signInToAccount: "Sign in to your account",
      labAnimalManagement: "Lab Animal Management",
    },
    // Animal Fields
    animal: {
      title: "Animal",
      animalId: "Animal ID",
      cage: "Cage",
      strain: "Strain",
      gender: "Gender",
      male: "Male",
      female: "Female",
      status: "Status",
      healthStatus: "Health Status",
      weight: "Weight",
      age: "Age",
      dateOfBirth: "Date of Birth",
      genotype: "Genotype",
      protocol: "Protocol",
      probes: "Probes",
      diseases: "Diseases/Conditions",
      notes: "Notes",
      breed: "Breed",
      addAnimal: "Add Animal",
      editAnimal: "Edit Animal",
      saveAnimal: "Save Animal",
      deleteAnimal: "Delete Animal",
      totalAnimals: "Total Animals",
      noAnimals: "No Animals",
      noAnimalsInCage: "This cage currently has no animals assigned to it.",
      animalsWithStrain: "Animals with this Strain",
      noAnimalsWithStrain: "No animals with this strain",
    },
    // Cage Fields
    cage: {
      title: "Cage",
      cageNumber: "Cage Number",
      room: "Room",
      roomNumber: "Room Number",
      location: "Location",
      capacity: "Capacity",
      status: "Status",
      animals: "Animals",
      lastUpdated: "Last Updated",
      currentOccupancy: "Current Occupancy",
      newCage: "New Cage",
      editCage: "Edit Cage",
      saveCage: "Save Cage",
      deleteCage: "Delete Cage",
      activeCages: "Active Cages",
      totalCages: "Total Cages",
      cagesWithStrain: "Cages with this Strain",
      noCagesWithStrain: "No cages with this strain",
      cageNotFound: "Cage not found",
      qrAlreadyLinked: "This QR code is already linked to a cage",
      qrLinkedSuccess: "QR code successfully linked to cage",
    },
    // Strain Fields
    strain: {
      title: "Strain",
      strainName: "Strain Name",
      addStrain: "Add New Strain",
      editStrain: "Edit Strain",
      saveStrain: "Save Strain",
      deleteStrain: "Delete Strain",
      strainNotFound: "Strain not found",
      strainNotFoundDesc: "The strain you are looking for does not exist or was deleted",
    },
    // Status Values
    statuses: {
      active: "Active",
      inactive: "Inactive",
      sick: "Sick",
      quarantine: "Quarantine",
      monitoring: "Monitoring",
      blocked: "Blocked",
      healthy: "Healthy",
      pending: "Pending",
      expired: "Expired",
      accepted: "Accepted",
    },
    // User Management
    users: {
      title: "User Management",
      description: "Manage user roles and permissions in the system",
      name: "Name",
      email: "Email",
      emailAddress: "Email Address",
      role: "Role",
      userRole: "User Role",
      status: "Status",
      actions: "Actions",
      unknownUser: "Unknown User",
      currentUser: "(You)",
      editRole: "Edit Role",
      updateRole: "Update User Role",
      updatingRoleFor: "Updating role for:",
      deleteUser: "Delete User",
      unblockUser: "Unblock User",
      inviteNewUser: "Invite New User",
      inviteDescription: "Send an invitation to a new user via email.",
      invitationLink: "Invitation Link",
      selectRole: "Select a role",
      onlyAdminsCanAssignAdmin: "Only admins can assign admin role",
      systemUsers: "System Users",
    },
    // Roles
    roles: {
      employee: "Employee",
      director: "Director",
      successManager: "Success Manager",
      admin: "Admin",
    },
    // Dashboard
    dashboard: {
      title: "Dashboard",
      overview: "Overview",
      recentActivity: "Recent Activity",
      quickActions: "Quick Actions",
      systemOverview: "System Overview",
    },
    // QR Codes
    qr: {
      title: "QR Code",
      qrCodeId: "QR Code ID",
      qrCodeGenerator: "QR Code Generator",
      qrCodeScanner: "QR Scanner",
      scanQrCodes: "Scan QR codes to view animal information",
      generateBlankQr: "Generate Blank QR Codes",
      numberOfQr: "Number of QR Codes (1-20)",
      size: "Size",
      small: "Small",
      medium: "Medium",
      large: "Large",
      extraLarge: "Extra Large",
      printQrCodes: "Print QR Codes",
      printQrCode: "Print QR Code",
      linkBlankQr: "Link Blank QR Code",
      qrNotFound: "QR Code not found",
      demoAnimalQr: "Demo Animal QR",
      demoBlankQr: "Demo Blank QR",
      scannedAnimalInfo: "Scanned Animal Information",
    },
    // Reports
    reports: {
      title: "Reports",
      generatedOn: "Generated on",
      at: "at",
    },
    // Trash
    trash: {
      title: "Trash",
      movedToTrash: "Moved to Trash",
      permanentlyDeleted: "Permanently Deleted",
      deletesPermanently: "Deletes permanently in",
      days: "days",
      day: "day",
      restoreItem: "Restore Item",
      deletePermanently: "Delete Permanently",
    },
    // Admin
    admin: {
      title: "Admin Panel",
      description: "Administrative controls and system management",
      setup: "Admin Setup",
      currentUser: "Current user:",
      activateAdminRole: "Activate Admin Role",
      adminPrivilegesActive: "Admin privileges active",
      onlySpecificUserCanSetup: "Only galindo243@live.com can set up admin privileges",
      userManagement: "User Management",
      userManagementDesc: "Manage user roles and permissions across the system.",
      goToUserManagement: "Go to User Management",
      systemStatus: "System status and administrative controls.",
      databaseStatus: "Database Status: Connected",
      authenticationActive: "Authentication: Active",
      adminFeatures: "Admin Features",
      fullSystemAccess: "Full System Access",
      fullSystemAccessDesc: "As an admin, you have access to all features including:",
      allAnimalCageManagement: "All animal and cage management",
      userManagementRoles: "User management and role assignment",
      qrCodeManagement: "QR code generation and management",
      auditLogs: "Audit logs and system reports",
      administrativeControls: "Administrative controls",
    },
    // Search
    search: {
      placeholder: "Search",
      searching: "Searching...",
      results: "Results",
      noResults: "No results found",
      noResultsFor: "No results found for",
      searchAnimals: "Search for animals, cages, and users",
    },
    // Dialogs & Confirmations
    dialogs: {
      areYouSure: "Are you sure?",
      deleteAnimalConfirm: "Are you sure you want to delete this animal?",
      deleteCageConfirm: "Are you sure you want to delete this cage?",
      deleteStrainConfirm: "Are you sure you want to delete this strain?",
      permanentDeletion: "Permanent Deletion",
      cannotBeUndone: "This action cannot be undone.",
    },
    // Audit Log
    audit: {
      changeHistory: "Change History",
      totalActions: "Total Actions",
      created: "Created",
      updated: "Updated",
      deleted: "Deleted",
      restored: "Restored",
      username: "Username",
      action: "Action",
      timestamp: "Timestamp",
    },
    // Common
    common: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      warning: "Warning",
      info: "Information",
      laboratoryAnimalManagementSystem: "Laboratory Animal Management System",
      notFound: "404 Page Not Found",
      pageNotFoundDesc: "Did you forget to add the page to the router?",
    },
  },
  es: {
    // Navigation
    nav: {
      dashboard: "Panel de Control",
      animals: "Animales",
      cages: "Jaulas",
      strains: "Cepas",
      reports: "Reportes",
      trash: "Papelera",
      users: "Gestión de Usuarios",
      admin: "Panel de Admin",
      blankQr: "Generar QR en Blanco",
      qrScanner: "Escáner QR",
      menu: "Menú",
      labManagement: "Gestión de Laboratorio",
      labManager: "Gestor de Lab",
    },
    // Common Actions
    actions: {
      save: "Guardar",
      cancel: "Cancelar",
      edit: "Editar",
      delete: "Eliminar",
      view: "Ver",
      add: "Agregar",
      close: "Cerrar",
      search: "Buscar",
      download: "Descargar",
      print: "Imprimir",
      copy: "Copiar",
      restore: "Restaurar",
      signOut: "Cerrar Sesión",
      update: "Actualizar",
      invite: "Invitar",
      activate: "Activar",
      unblock: "Desbloquear",
      block: "Bloquear",
      startScanner: "Iniciar Escáner",
      stopScanner: "Detener Escáner",
      viewFullRecord: "Ver Registro Completo",
      clearData: "Limpiar Datos",
      scanAnother: "Escanear Otro QR",
      backTo: "Volver a",
    },
    // Theme
    theme: {
      lightMode: "Modo Claro",
      darkMode: "Modo Oscuro",
      language: "Idioma",
      english: "Inglés",
      spanish: "Español",
    },
    // Authentication
    auth: {
      signIn: "Iniciar Sesión",
      signInToAccount: "Inicia sesión en tu cuenta",
      labAnimalManagement: "Gestión de Animales de Laboratorio",
    },
    // Animal Fields
    animal: {
      title: "Animal",
      animalId: "ID de Animal",
      cage: "Jaula",
      strain: "Cepa",
      gender: "Género",
      male: "Macho",
      female: "Hembra",
      status: "Estado",
      healthStatus: "Estado de Salud",
      weight: "Peso",
      age: "Edad",
      dateOfBirth: "Fecha de Nacimiento",
      genotype: "Genotipo",
      protocol: "Protocolo",
      probes: "Sondas",
      diseases: "Enfermedades/Condiciones",
      notes: "Notas",
      breed: "Raza",
      addAnimal: "Agregar Animal",
      editAnimal: "Editar Animal",
      saveAnimal: "Guardar Animal",
      deleteAnimal: "Eliminar Animal",
      totalAnimals: "Total de Animales",
      noAnimals: "Sin Animales",
      noAnimalsInCage: "Esta jaula no tiene animales asignados actualmente.",
      animalsWithStrain: "Animales con esta Cepa",
      noAnimalsWithStrain: "No hay animales con esta cepa",
    },
    // Cage Fields
    cage: {
      title: "Jaula",
      cageNumber: "Número de Jaula",
      room: "Sala",
      roomNumber: "Número de Sala",
      location: "Ubicación",
      capacity: "Capacidad",
      status: "Estado",
      animals: "Animales",
      lastUpdated: "Última Actualización",
      currentOccupancy: "Ocupación Actual",
      newCage: "Nueva Jaula",
      editCage: "Editar Jaula",
      saveCage: "Guardar Jaula",
      deleteCage: "Eliminar Jaula",
      activeCages: "Jaulas Activas",
      totalCages: "Total de Jaulas",
      cagesWithStrain: "Jaulas con esta Cepa",
      noCagesWithStrain: "No hay jaulas con esta cepa",
      cageNotFound: "Jaula no encontrada",
      qrAlreadyLinked: "Este código QR ya está vinculado a una jaula",
      qrLinkedSuccess: "Código QR vinculado exitosamente a la jaula",
    },
    // Strain Fields
    strain: {
      title: "Cepa",
      strainName: "Nombre de Cepa",
      addStrain: "Agregar Nueva Cepa",
      editStrain: "Editar Cepa",
      saveStrain: "Guardar Cepa",
      deleteStrain: "Eliminar Cepa",
      strainNotFound: "Cepa no encontrada",
      strainNotFoundDesc: "La cepa que buscas no existe o fue eliminada",
    },
    // Status Values
    statuses: {
      active: "Activo",
      inactive: "Inactivo",
      sick: "Enfermo",
      quarantine: "Cuarentena",
      monitoring: "Monitoreo",
      blocked: "Bloqueado",
      healthy: "Saludable",
      pending: "Pendiente",
      expired: "Expirado",
      accepted: "Aceptado",
    },
    // User Management
    users: {
      title: "Gestión de Usuarios",
      description: "Administra roles y permisos de usuarios en el sistema",
      name: "Nombre",
      email: "Correo",
      emailAddress: "Dirección de Correo",
      role: "Rol",
      userRole: "Rol de Usuario",
      status: "Estado",
      actions: "Acciones",
      unknownUser: "Usuario Desconocido",
      currentUser: "(Tú)",
      editRole: "Editar Rol",
      updateRole: "Actualizar Rol de Usuario",
      updatingRoleFor: "Actualizando rol para:",
      deleteUser: "Eliminar Usuario",
      unblockUser: "Desbloquear Usuario",
      inviteNewUser: "Invitar Nuevo Usuario",
      inviteDescription: "Envía una invitación a un nuevo usuario por correo.",
      invitationLink: "Enlace de Invitación",
      selectRole: "Selecciona un rol",
      onlyAdminsCanAssignAdmin: "Solo los administradores pueden asignar el rol de admin",
      systemUsers: "Usuarios del Sistema",
    },
    // Roles
    roles: {
      employee: "Empleado",
      director: "Director",
      successManager: "Gerente de Éxito",
      admin: "Administrador",
    },
    // Dashboard
    dashboard: {
      title: "Panel de Control",
      overview: "Resumen",
      recentActivity: "Actividad Reciente",
      quickActions: "Acciones Rápidas",
      systemOverview: "Resumen del Sistema",
    },
    // QR Codes
    qr: {
      title: "Código QR",
      qrCodeId: "ID de Código QR",
      qrCodeGenerator: "Generador de Códigos QR",
      qrCodeScanner: "Escáner QR",
      scanQrCodes: "Escanea códigos QR para ver información de animales",
      generateBlankQr: "Generar Códigos QR en Blanco",
      numberOfQr: "Número de Códigos QR (1-20)",
      size: "Tamaño",
      small: "Pequeño",
      medium: "Mediano",
      large: "Grande",
      extraLarge: "Extra Grande",
      printQrCodes: "Imprimir Códigos QR",
      printQrCode: "Imprimir Código QR",
      linkBlankQr: "Vincular Código QR en Blanco",
      qrNotFound: "Código QR no encontrado",
      demoAnimalQr: "Demo QR de Animal",
      demoBlankQr: "Demo QR en Blanco",
      scannedAnimalInfo: "Información del Animal Escaneado",
    },
    // Reports
    reports: {
      title: "Reportes",
      generatedOn: "Generado el",
      at: "a las",
    },
    // Trash
    trash: {
      title: "Papelera",
      movedToTrash: "Movido a Papelera",
      permanentlyDeleted: "Eliminado Permanentemente",
      deletesPermanently: "Se eliminará permanentemente en",
      days: "días",
      day: "día",
      restoreItem: "Restaurar Elemento",
      deletePermanently: "Eliminar Permanentemente",
    },
    // Admin
    admin: {
      title: "Panel de Administración",
      description: "Controles administrativos y gestión del sistema",
      setup: "Configuración de Admin",
      currentUser: "Usuario actual:",
      activateAdminRole: "Activar Rol de Admin",
      adminPrivilegesActive: "Privilegios de admin activos",
      onlySpecificUserCanSetup: "Solo galindo243@live.com puede configurar privilegios de admin",
      userManagement: "Gestión de Usuarios",
      userManagementDesc: "Administra roles y permisos de usuarios en el sistema.",
      goToUserManagement: "Ir a Gestión de Usuarios",
      systemStatus: "Estado del sistema y controles administrativos.",
      databaseStatus: "Estado de Base de Datos: Conectado",
      authenticationActive: "Autenticación: Activa",
      adminFeatures: "Funciones de Admin",
      fullSystemAccess: "Acceso Completo al Sistema",
      fullSystemAccessDesc: "Como admin, tienes acceso a todas las funciones incluyendo:",
      allAnimalCageManagement: "Gestión completa de animales y jaulas",
      userManagementRoles: "Gestión de usuarios y asignación de roles",
      qrCodeManagement: "Generación y gestión de códigos QR",
      auditLogs: "Registros de auditoría y reportes del sistema",
      administrativeControls: "Controles administrativos",
    },
    // Search
    search: {
      placeholder: "Buscar",
      searching: "Buscando...",
      results: "Resultados",
      noResults: "No se encontraron resultados",
      noResultsFor: "No se encontraron resultados para",
      searchAnimals: "Buscar animales, jaulas y usuarios",
    },
    // Dialogs & Confirmations
    dialogs: {
      areYouSure: "¿Estás seguro?",
      deleteAnimalConfirm: "¿Estás seguro de que quieres eliminar este animal?",
      deleteCageConfirm: "¿Estás seguro de que quieres eliminar esta jaula?",
      deleteStrainConfirm: "¿Estás seguro de que quieres eliminar esta cepa?",
      permanentDeletion: "Eliminación Permanente",
      cannotBeUndone: "Esta acción no se puede deshacer.",
    },
    // Audit Log
    audit: {
      changeHistory: "Historial de Cambios",
      totalActions: "Total de Acciones",
      created: "Creado",
      updated: "Actualizado",
      deleted: "Eliminado",
      restored: "Restaurado",
      username: "Nombre de Usuario",
      action: "Acción",
      timestamp: "Fecha y Hora",
    },
    // Common
    common: {
      loading: "Cargando...",
      error: "Error",
      success: "Éxito",
      warning: "Advertencia",
      info: "Información",
      laboratoryAnimalManagementSystem: "Sistema de Gestión de Animales de Laboratorio",
      notFound: "404 Página No Encontrada",
      pageNotFoundDesc: "¿Olvidaste agregar la página al enrutador?",
    },
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved as Language) || "en";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "es" : "en");
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}
