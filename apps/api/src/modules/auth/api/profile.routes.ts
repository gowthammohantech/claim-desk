import { PermissionCode } from '@claimdesk/contracts';
import { Router } from 'express';

import { requireActor } from '../../../http/middleware/authenticate.js';
import { AppError } from '../../../platform/errors/index.js';
import type { EmployeeRepository } from '../../employee/index.js';
import type { MasterDataRepository } from '../../master-data/index.js';
import { toEmployeeDto } from './employee.serializer.js';

/** `GET /me` and `GET /me/engagements`. */
export function profileRoutes(
  employees: EmployeeRepository,
  masterData: MasterDataRepository,
): Router {
  const router = Router();

  router.get('/me', (req, res, next) => {
    const actor = requireActor(req);
    employees
      .findById(actor.employeeId)
      .then((employee) => {
        if (!employee) throw AppError.notFound('Employee');
        res.json({
          ...toEmployeeDto(employee),
          permissions: actor.extraPermissions ?? [],
        });
      })
      .catch(next);
  });

  router.get('/me/engagements', (req, res, next) => {
    const actor = requireActor(req);
    // Only OPEN engagements the employee is assigned to are selectable
    // (design/11 §3); closed ones stay readable through a claim.
    masterData
      .listSelectableEngagements(actor.employeeId)
      .then((engagements) => {
        res.json(
          engagements.map((engagement) => ({
            id: engagement.id,
            code: engagement.code,
            clientId: engagement.clientId,
            name: engagement.name,
            status: engagement.status,
          })),
        );
      })
      .catch(next);
  });

  return router;
}

export const PROFILE_PERMISSIONS = [PermissionCode.EXPENSE_READ_OWN] as const;
