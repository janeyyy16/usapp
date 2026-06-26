import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db, isFirebaseReady } from "./config";
import { createUserWithEmailAndPassword, updatePassword } from "firebase/auth";
import { auth } from "./config";

/**
 * User roles in the system
 */
export type UserRole =
  | "SUPERADMIN"    // Access to all companies, can create/manage admins
  | "ADMIN"         // Company admin, full access to company data
  | "MANAGER"       // Can manage tickets, employees, reports
  | "CSR"           // Customer Service Rep, ticket management
  | "TECHNICIAN"    // Field technician
  | "DISPATCHER"    // Dispatch management
  | "HR"            // HR and payroll access
  | "IT"            // IT support
  | "PARTS"         // Parts management
  | "FINANCE";      // Financial reports and billing

/**
 * User account structure in Firestore
 */
export interface UserAccount {
  uid: string;
  email: string;
  loginName?: string; // Login name (may differ from username)
  username: string; // Format: FirstName.LastName (e.g., "Jhon.Rulona")
  displayName: string;
  companyId: string;
  role: UserRole;
  isActive: boolean;
  phoneNumber?: string;
  employeeId?: string;
  department?: string;
  // Extended assignment fields (from the Add New User form)
  managerName?: string;
  technicianId?: string;
  assignedBranch?: string;
  branchAccess?: string;
  poInitials?: string;
  requiredCheckIn?: string;
  requiredCheckOut?: string;
  daysOff?: number[];
  createdAt: Timestamp | Date;
  createdBy: string; // UID of creator
  updatedAt: Timestamp | Date;
  lastLogin?: Timestamp | Date;
  supabaseUserId?: string; // For future Supabase integration
  permissions?: string[]; // Additional granular permissions
}

/**
 * Generate username from display name
 * Format: FirstName.LastName
 * Example: "Jhon Norban Rulona" -> "Jhon.Rulona"
 */
export function generateUsername(displayName: string): string {
  const nameParts = displayName.trim().split(/\s+/);
  
  if (nameParts.length === 0) {
    return "";
  }
  
  if (nameParts.length === 1) {
    // If only one name, use it as username
    return nameParts[0];
  }
  
  // First name + Last name (skip middle names)
  const firstName = nameParts[0];
  const lastName = nameParts[nameParts.length - 1];
  
  return `${firstName}.${lastName}`;
}

/**
 * Company structure in Firestore
 */
export interface Company {
  companyId: string;
  companyName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  email: string;
  isActive: boolean;
  subscriptionPlan?: "basic" | "professional" | "enterprise";
  subscriptionExpiresAt?: Timestamp | Date;
  createdAt: Timestamp | Date;
  createdBy: string;
  settings?: {
    timezone?: string;
    dateFormat?: string;
    currency?: string;
    [key: string]: any;
  };
}

/**
 * Create a new company
 */
export async function createCompany(
  companyData: Omit<Company, "companyId" | "createdAt" | "createdBy">,
  creatorUid: string
): Promise<string> {
  if (!isFirebaseReady() || !db) {
    throw new Error("Firestore not configured");
  }

  try {
    // Generate company ID
    const companyId = `COMP${Date.now()}`;
    const companyRef = doc(db, "companies", companyId);

    await setDoc(companyRef, {
      ...companyData,
      companyId,
      createdAt: serverTimestamp(),
      createdBy: creatorUid,
    });

    console.log(`✅ Company created: ${companyId}`);
    return companyId;
  } catch (error) {
    console.error("Error creating company:", error);
    throw error;
  }
}

/**
 * Get company by ID
 */
export async function getCompany(companyId: string): Promise<Company | null> {
  if (!isFirebaseReady() || !db) {
    throw new Error("Firestore not configured");
  }

  try {
    const companyRef = doc(db, "companies", companyId);
    const companySnap = await getDoc(companyRef);

    if (!companySnap.exists()) {
      return null;
    }

    return companySnap.data() as Company;
  } catch (error) {
    console.error("Error fetching company:", error);
    return null;
  }
}

/**
 * Get all companies (SUPERADMIN only)
 */
export async function getAllCompanies(): Promise<Company[]> {
  if (!isFirebaseReady() || !db) {
    throw new Error("Firestore not configured");
  }

  try {
    const companiesRef = collection(db, "companies");
    const q = query(companiesRef, orderBy("companyName"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => doc.data() as Company);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return [];
  }
}

/**
 * Update company
 */
export async function updateCompany(
  companyId: string,
  updates: Partial<Omit<Company, "companyId" | "createdAt" | "createdBy">>
): Promise<void> {
  if (!isFirebaseReady() || !db) {
    throw new Error("Firestore not configured");
  }

  try {
    const companyRef = doc(db, "companies", companyId);
    await updateDoc(companyRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ Company updated: ${companyId}`);
  } catch (error) {
    console.error("Error updating company:", error);
    throw error;
  }
}

/**
 * Create a new user account
 */
export async function createUserAccount(
  userData: {
    email: string;
    password: string;
    displayName: string;
    companyId: string;
    role: UserRole;
    loginName?: string;
    phoneNumber?: string;
    employeeId?: string;
    department?: string;
    managerName?: string;
    technicianId?: string;
    assignedBranch?: string;
    branchAccess?: string;
    poInitials?: string;
    requiredCheckIn?: string;
    requiredCheckOut?: string;
    daysOff?: number[];
    permissions?: string[];
  },
  creatorUid: string
): Promise<string> {
  if (!isFirebaseReady() || !db || !auth) {
    throw new Error("Firebase not configured");
  }

  try {
    // 1. Generate username from display name
    const username = generateUsername(userData.displayName);

    // 2. Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );
    const uid = userCredential.user.uid;

    // 3. Build the full profile record (every form field is persisted here)
    const profile = {
      uid,
      email: userData.email,
      loginName: userData.loginName || username,
      username,
      displayName: userData.displayName,
      companyId: userData.companyId,
      role: userData.role,
      isActive: true,
      phoneNumber: userData.phoneNumber || "",
      employeeId: userData.employeeId || "",
      department: userData.department || "",
      managerName: userData.managerName || "",
      technicianId: userData.technicianId || "",
      assignedBranch: userData.assignedBranch || "",
      branchAccess: userData.branchAccess || "",
      poInitials: userData.poInitials || "",
      requiredCheckIn: userData.requiredCheckIn || "",
      requiredCheckOut: userData.requiredCheckOut || "",
      daysOff: userData.daysOff || [],
      permissions: userData.permissions || [],
      createdAt: serverTimestamp(),
      createdBy: creatorUid,
      updatedAt: serverTimestamp(),
    };

    // 4. Write to a ROLE-GROUPED, STATUS-GROUPED path so the Firestore console
    //    is navigable by role instead of showing a flat list of opaque doc IDs:
    //      users / {ROLE} / {Active|Inactive} / {uid}
    //    The uid is also stored as a field (profile.uid) for lookups.
    const status = profile.isActive ? "Active" : "Inactive";
    const groupedRef = doc(db, "users", userData.role, status, uid);
    await setDoc(groupedRef, profile);

    // 5. Keep a flat lookup index at users_index/{uid} so existing code that
    //    reads users/{uid} by uid still works and login lookups stay O(1).
    const indexRef = doc(db, "users_index", uid);
    await setDoc(indexRef, { ...profile, path: `users/${userData.role}/${status}/${uid}` });

    console.log(`✅ User created: ${uid} (${userData.email}) under users/${userData.role}/${status}`);
    return uid;
  } catch (error: any) {
    console.error("Error creating user:", error);

    if (error.code === "auth/email-already-in-use") {
      throw new Error("Email already in use");
    } else if (error.code === "auth/weak-password") {
      throw new Error("Password too weak (minimum 6 characters)");
    } else if (error.code === "auth/invalid-email") {
      throw new Error("Invalid email address");
    }

    throw error;
  }
}

/**
 * Get user account by UID
 */
export async function getUserAccount(uid: string): Promise<UserAccount | null> {
  if (!isFirebaseReady() || !db) {
    throw new Error("Firestore not configured");
  }

  try {
    // Read from the flat lookup index (users_index/{uid}), which mirrors the
    // role-grouped record at users/{role}/{status}/{uid}.
    const indexRef = doc(db, "users_index", uid);
    const indexSnap = await getDoc(indexRef);
    if (indexSnap.exists()) {
      return indexSnap.data() as UserAccount;
    }
    // Back-compat: fall back to the legacy flat users/{uid} path.
    const legacyRef = doc(db, "users", uid);
    const legacySnap = await getDoc(legacyRef);
    return legacySnap.exists() ? (legacySnap.data() as UserAccount) : null;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

/**
 * Get user account by username and company ID
 * Used for username login
 */
export async function getUserByUsername(
  username: string,
  companyId: string
): Promise<UserAccount | null> {
  if (!isFirebaseReady() || !db) {
    throw new Error("Firestore not configured");
  }

  try {
    const usersRef = collection(db, "users_index");
    // Simplified query - only username and companyId (no isActive check here)
    const q = query(
      usersRef,
      where("username", "==", username),
      where("companyId", "==", companyId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    // Get first matching user and check if active
    const user = snapshot.docs[0].data() as UserAccount;
    
    // Check if user is active
    if (!user.isActive) {
      console.warn(`User ${username} is inactive`);
      return null;
    }

    return user;
  } catch (error) {
    console.error("Error fetching user by username:", error);
    return null;
  }
}

/**
 * Get all users in a company
 */
export async function getCompanyUsers(companyId: string): Promise<UserAccount[]> {
  if (!isFirebaseReady() || !db) {
    throw new Error("Firestore not configured");
  }

  try {
    const usersRef = collection(db, "users_index");
    const q = query(
      usersRef,
      where("companyId", "==", companyId)
      // Note: Removed orderBy to avoid composite index requirement
      // Users will be sorted in the UI instead
    );
    const snapshot = await getDocs(q);

    const users = snapshot.docs.map((doc) => doc.data() as UserAccount);
    
    // Sort in memory by display name
    return users.sort((a, b) => 
      (a.displayName || "").localeCompare(b.displayName || "")
    );
  } catch (error) {
    console.error("Error fetching company users:", error);
    return [];
  }
}

/**
 * Get all users (SUPERADMIN only)
 */
export async function getAllUsers(): Promise<UserAccount[]> {
  if (!isFirebaseReady() || !db) {
    throw new Error("Firestore not configured");
  }

  try {
    const usersRef = collection(db, "users_index");
    const q = query(usersRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => doc.data() as UserAccount);
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
}

/**
 * Update user account
 */
export async function updateUserAccount(
  uid: string,
  updates: Partial<Omit<UserAccount, "uid" | "email" | "createdAt" | "createdBy">>
): Promise<void> {
  if (!isFirebaseReady() || !db) {
    throw new Error("Firestore not configured");
  }

  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ User updated: ${uid}`);
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

/**
 * Deactivate user account (soft delete)
 */
export async function deactivateUserAccount(uid: string): Promise<void> {
  if (!isFirebaseReady() || !db) {
    throw new Error("Firestore not configured");
  }

  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      isActive: false,
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ User deactivated: ${uid}`);
  } catch (error) {
    console.error("Error deactivating user:", error);
    throw error;
  }
}

/**
 * Activate user account
 */
export async function activateUserAccount(uid: string): Promise<void> {
  if (!isFirebaseReady() || !db) {
    throw new Error("Firestore not configured");
  }

  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      isActive: true,
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ User activated: ${uid}`);
  } catch (error) {
    console.error("Error activating user:", error);
    throw error;
  }
}

/**
 * Delete user account (hard delete - use with caution)
 */
export async function deleteUserAccount(uid: string): Promise<void> {
  if (!isFirebaseReady() || !db) {
    throw new Error("Firestore not configured");
  }

  try {
    const userRef = doc(db, "users", uid);
    await deleteDoc(userRef);

    console.log(`✅ User deleted: ${uid}`);
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

/**
 * Get users by role
 */
export async function getUsersByRole(
  companyId: string,
  role: UserRole
): Promise<UserAccount[]> {
  if (!isFirebaseReady() || !db) {
    throw new Error("Firestore not configured");
  }

  try {
    const usersRef = collection(db, "users_index");
    const q = query(
      usersRef,
      where("companyId", "==", companyId),
      where("role", "==", role),
      where("isActive", "==", true)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => doc.data() as UserAccount);
  } catch (error) {
    console.error("Error fetching users by role:", error);
    return [];
  }
}

/**
 * Check if user has permission
 */
export async function hasPermission(
  uid: string,
  requiredRole: UserRole | UserRole[]
): Promise<boolean> {
  const user = await getUserAccount(uid);

  if (!user || !user.isActive) {
    return false;
  }

  // SUPERADMIN has all permissions
  if (user.role === "SUPERADMIN") {
    return true;
  }

  // Check if user role matches
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(user.role);
  }

  return user.role === requiredRole;
}

/**
 * Update user last login timestamp
 */
export async function updateLastLogin(uid: string): Promise<void> {
  if (!isFirebaseReady() || !db) {
    return;
  }

  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      lastLogin: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating last login:", error);
  }
}
