import { logger } from '@/lib/logger';
import { 
    Evaluation, 
    CreateEvaluationRequest, 
    UpdateEvaluationRequest,
    EvaluationFilters 
} from '@/types/evaluation.types';

/**
 * Evaluation Service
 * 
 * Note: This service manages evaluations locally since the API documentation
 * doesn't specify evaluation endpoints. Evaluations are stored in localStorage
 * for now, but can be easily migrated to API endpoints when available.
 */
export class EvaluationService {
    private storageKey = 'distrischool_evaluations';
    private nextId = 1;

    constructor() {
        // Initialize nextId from existing evaluations
        if (typeof window !== 'undefined') {
            const existing = this.getAllFromStorage();
            if (existing.length > 0) {
                this.nextId = Math.max(...existing.map(e => e.id)) + 1;
            }
        }
    }

    private getAllFromStorage(): Evaluation[] {
        if (typeof window === 'undefined') {
            return [];
        }
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            logger.error('Evaluation Service', 'Error reading from storage', error);
            return [];
        }
    }

    private saveToStorage(evaluations: Evaluation[]): void {
        if (typeof window === 'undefined') {
            return;
        }
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(evaluations));
        } catch (error) {
            logger.error('Evaluation Service', 'Error saving to storage', error);
        }
    }

    /**
     * Get all evaluations with optional filters
     */
    async getAll(filters?: EvaluationFilters): Promise<Evaluation[]> {
        logger.info('Evaluation Service', 'Fetching all evaluations', filters);
        let evaluations = this.getAllFromStorage();

        // Apply filters
        if (filters) {
            if (filters.classId) {
                evaluations = evaluations.filter(e => e.classId === filters.classId);
            }
            if (filters.subjectId) {
                evaluations = evaluations.filter(e => e.subjectId === filters.subjectId);
            }
            if (filters.academicYear) {
                evaluations = evaluations.filter(e => e.academicYear === filters.academicYear);
            }
            if (filters.academicSemester) {
                evaluations = evaluations.filter(e => e.academicSemester === filters.academicSemester);
            }
            if (filters.type) {
                evaluations = evaluations.filter(e => e.type === filters.type);
            }
        }

        logger.success('Evaluation Service', `Found ${evaluations.length} evaluations`);
        return evaluations;
    }

    /**
     * Get evaluation by ID
     */
    async getById(id: number): Promise<Evaluation | null> {
        logger.info('Evaluation Service', `Fetching evaluation ID: ${id}`);
        const evaluations = this.getAllFromStorage();
        const evaluation = evaluations.find(e => e.id === id);
        
        if (evaluation) {
            logger.success('Evaluation Service', `Found evaluation ID: ${id}`);
        } else {
            logger.warn('Evaluation Service', `Evaluation ID: ${id} not found`);
        }
        
        return evaluation || null;
    }

    /**
     * Get evaluations by class ID
     */
    async getByClass(classId: number): Promise<Evaluation[]> {
        return this.getAll({ classId });
    }

    /**
     * Get evaluations by subject ID
     */
    async getBySubject(subjectId: number): Promise<Evaluation[]> {
        return this.getAll({ subjectId });
    }

    /**
     * Create a new evaluation
     */
    async create(data: CreateEvaluationRequest): Promise<Evaluation> {
        logger.info('Evaluation Service', `Creating evaluation: ${data.name}`);
        
        const now = new Date().toISOString();
        const evaluation: Evaluation = {
            id: this.nextId++,
            name: data.name,
            type: data.type,
            description: data.description,
            classId: data.classId,
            subjectId: data.subjectId,
            academicYear: data.academicYear,
            academicSemester: data.academicSemester,
            maxGrade: data.maxGrade || 10.0,
            weight: data.weight,
            createdAt: now,
            updatedAt: now,
        };

        const evaluations = this.getAllFromStorage();
        evaluations.push(evaluation);
        this.saveToStorage(evaluations);

        logger.success('Evaluation Service', `Evaluation created ID: ${evaluation.id}`);
        return evaluation;
    }

    /**
     * Update an existing evaluation
     */
    async update(id: number, data: UpdateEvaluationRequest): Promise<Evaluation> {
        logger.info('Evaluation Service', `Updating evaluation ID: ${id}`);
        
        const evaluations = this.getAllFromStorage();
        const index = evaluations.findIndex(e => e.id === id);
        
        if (index === -1) {
            throw new Error(`Evaluation with ID ${id} not found`);
        }

        const updated: Evaluation = {
            ...evaluations[index],
            ...data,
            updatedAt: new Date().toISOString(),
        };

        evaluations[index] = updated;
        this.saveToStorage(evaluations);

        logger.success('Evaluation Service', `Evaluation updated ID: ${id}`);
        return updated;
    }

    /**
     * Delete an evaluation
     */
    async delete(id: number): Promise<void> {
        logger.info('Evaluation Service', `Deleting evaluation ID: ${id}`);
        
        const evaluations = this.getAllFromStorage();
        const filtered = evaluations.filter(e => e.id !== id);
        
        if (filtered.length === evaluations.length) {
            throw new Error(`Evaluation with ID ${id} not found`);
        }

        this.saveToStorage(filtered);
        logger.success('Evaluation Service', `Evaluation deleted ID: ${id}`);
    }
}

export const evaluationService = new EvaluationService();


