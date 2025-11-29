import { scheduleService } from '@/services/schedule.service';
import { teacherService } from '@/services/teacher.service';
import { Schedule } from '@/types/schedule.types';
import { User } from '@/types/auth.types';
import { GradeResponseDTO } from '@/types/grade.types';
import { Teacher } from '@/types/teacher.types';

/**
 * Get classes that a teacher teaches
 */
export async function getTeacherClasses(teacherId: number): Promise<number[]> {
    try {
        const schedulesResponse = await scheduleService.getAll();
        const allSchedules = Array.isArray(schedulesResponse)
            ? schedulesResponse
            : (schedulesResponse as any).content || [];
        
        const teacherSchedules = allSchedules.filter(
            (schedule: Schedule) => schedule.teacherId === teacherId
        );
        
        const classIds = new Set(
            teacherSchedules
                .map((s: Schedule) => s.classId || s.classEntity?.id)
                .filter(Boolean)
        );
        
        return Array.from(classIds) as number[];
    } catch (error) {
        console.error('Error getting teacher classes:', error);
        return [];
    }
}

/**
 * Check if a teacher can access a specific class
 */
export async function canTeacherAccessClass(
    teacherId: number,
    classId: number
): Promise<boolean> {
    const teacherClasses = await getTeacherClasses(teacherId);
    return teacherClasses.includes(classId);
}

/**
 * Filter grades based on user role and access
 */
export function filterGradesByAccess(
    grades: GradeResponseDTO[],
    user: User | null
): GradeResponseDTO[] {
    if (!user) {
        return [];
    }

    const isAdmin = user.roles?.includes('ADMIN');
    const isStudent = user.roles?.includes('STUDENT');

    if (isAdmin) {
        // Admins can see all grades
        return grades;
    }

    if (isStudent) {
        // Students can only see their own grades
        const studentId = user.studentId ? Number(user.studentId) : null;
        if (!studentId) {
            return [];
        }
        return grades.filter((grade) => grade.studentId === studentId);
    }

    // Teachers can see grades for classes they teach
    // This will be filtered at the API/service level
    return grades;
}

/**
 * Get teacher ID from user (synchronous version - returns user.id as fallback)
 * Note: This may not be the correct teacher ID in the teacher service
 * Use getTeacherIdFromUserAsync for accurate teacher ID lookup
 */
export function getTeacherIdFromUser(user: User | null): number | null {
    if (!user) {
        return null;
    }

    const userId = Number(user.id);
    if (!isNaN(userId)) {
        return userId;
    }

    return null;
}

/**
 * Get teacher ID from user by looking up in teacher service
 * Tries multiple strategies:
 * 1. Try to get teacher by user ID (if IDs match)
 * 2. Search by email (case insensitive)
 * Returns the teacher ID from the teacher service, not the auth service
 */
export async function getTeacherIdFromUserAsync(user: User | null): Promise<number | null> {
    if (!user) {
        return null;
    }

    let foundTeacher: Teacher | null = null;

    // Strategy 1: Try to get teacher by user ID directly
    if (user.id) {
        try {
            const userId = Number(user.id);
            if (!isNaN(userId)) {
                foundTeacher = await teacherService.getById(userId);
            }
        } catch (error) {
            // If not found by ID, continue to next strategy
            console.log('Teacher not found by user ID, trying by email...');
        }
    }

    // Strategy 2: Search by email (case insensitive)
    if (!foundTeacher && user.email) {
        try {
            const allTeachers = await teacherService.getAll();
            const teachersArray = Array.isArray(allTeachers)
                ? allTeachers
                : (allTeachers as any).content || [];

            // Search by email (case insensitive and removing spaces)
            const userEmail = user.email.trim().toLowerCase();
            foundTeacher = teachersArray.find((t: Teacher) =>
                t.email?.trim().toLowerCase() === userEmail
            ) || null;
        } catch (error) {
            console.error('Error searching teachers by email:', error);
        }
    }

    if (foundTeacher) {
        return foundTeacher.id;
    }

    return null;
}

