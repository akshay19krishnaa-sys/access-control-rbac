import { ApprovalLevel } from '../models/ApprovalLevel.js';
import { INITIAL_SEED_APPROVAL_LEVELS } from '../data/seedData.js';
import { recordAuditLog } from '../utils/auditLogger.js';

export const getApprovalLevels = async (req, res, next) => {
  try {
    let levels = await ApprovalLevel.find().sort({ levelNumber: 1, createdAt: 1 });

    if (levels.length === 0) {
      console.log('[ApprovalLevel] Collection empty. Seeding initial approval levels...');
      await ApprovalLevel.insertMany(INITIAL_SEED_APPROVAL_LEVELS);
      levels = await ApprovalLevel.find().sort({ levelNumber: 1, createdAt: 1 });
    }

    res.status(200).json({
      success: true,
      data: levels,
      meta: {
        total: levels.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createApprovalLevel = async (req, res, next) => {
  try {
    const {
      name,
      levelNumber,
      approver,
      description,
      approvalLimit,
      threshold,
      turnaround,
      color,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Level name is required.',
          code: 'NAME_REQUIRED',
        },
      });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Level name cannot exceed 100 characters.',
          code: 'NAME_TOO_LONG',
        },
      });
    }

    if (!approver || !approver.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Approver role/title is required.',
          code: 'APPROVER_REQUIRED',
        },
      });
    }

    if (approver.trim().length > 100) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Approver role/title cannot exceed 100 characters.',
          code: 'APPROVER_TOO_LONG',
        },
      });
    }

    let finalLevelNumber = Number(levelNumber);
    if (!Number.isInteger(finalLevelNumber) || finalLevelNumber <= 0) {

      const highestLevel = await ApprovalLevel.findOne().sort({ levelNumber: -1 });
      finalLevelNumber = (highestLevel?.levelNumber || 0) + 1;
    }

    const existingNumber = await ApprovalLevel.findOne({ levelNumber: finalLevelNumber });
    if (existingNumber) {
      return res.status(409).json({
        success: false,
        error: {
          message: `Approval Level ${finalLevelNumber} already exists. Please choose a different level number.`,
          code: 'DUPLICATE_LEVEL_NUMBER',
        },
      });
    }

    const existingName = await ApprovalLevel.findOne({
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
    });
    if (existingName) {
      return res.status(409).json({
        success: false,
        error: {
          message: `An approval level with the name "${name.trim()}" already exists.`,
          code: 'DUPLICATE_LEVEL_NAME',
        },
      });
    }

    let finalThreshold = threshold && threshold.trim() ? threshold.trim() : '';
    let parsedLimit = null;

    if (approvalLimit !== undefined && approvalLimit !== null && approvalLimit !== '') {
      const numLimit = Number(approvalLimit);
      if (isNaN(numLimit) || numLimit < 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Approval limit must be a non-negative number.',
            code: 'INVALID_APPROVAL_LIMIT',
          },
        });
      }
      parsedLimit = numLimit;
      if (!finalThreshold) {
        finalThreshold = `Up to $${numLimit.toLocaleString()}`;
      }
    } else if (!finalThreshold) {
      finalThreshold = 'No Limit';
    }

    const defaultColors = ['#176B87', '#0284c7', '#0891b2', '#0d9488', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    const chosenColor = color && color.trim() ? color.trim() : defaultColors[(finalLevelNumber - 1) % defaultColors.length];

    const newLevel = await ApprovalLevel.create({
      levelNumber: finalLevelNumber,
      levelId: `L${finalLevelNumber}`,
      level: `Level ${finalLevelNumber}`,
      name: name.trim(),
      approver: approver.trim(),
      description: description ? description.trim() : '',
      approvalLimit: parsedLimit,
      threshold: finalThreshold,
      turnaround: turnaround && turnaround.trim() ? turnaround.trim() : '24 hours',
      color: chosenColor,
      status: 'ACTIVE',
    });

    await recordAuditLog({
      action: 'APPROVAL_LEVEL_CHANGED',
      actionDisplay: 'Approval Level Changed',
      entityType: 'ApprovalLevel',
      entityId: newLevel._id.toString(),
      entityName: newLevel.name,
      details: {
        levelNumber: newLevel.levelNumber,
        approver: newLevel.approver,
        threshold: newLevel.threshold,
        approvalLimit: newLevel.approvalLimit,
      },
      req,
    });

    res.status(201).json({
      success: true,
      data: newLevel,
      message: 'Approval level created successfully.',
    });
  } catch (error) {
    next(error);
  }
};
