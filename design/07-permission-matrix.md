# Claim Desk --- Permission Matrix

**Version:** 1.0

## 1. Roles

Employee, Reporting Manager, Engagement Manager, Partner, Finance,
Admin, Auditor/Read-only Management.

## 2. Permission Matrix

  -----------------------------------------------------------------------------------------------
  Resource / Action   Employee   Reporting   Engagement   Partner   Finance       Admin   Auditor
                                       Mgr          Mgr                                 
  ----------------- ---------- ----------- ------------ --------- --------- ----------- ---------
  Own expense                ✓    own only     own only  own only       ---   support\*         R
  create/edit draft                                                                     

  Own expense                ✓    own only     own only  own only       ---   support\*         R
  delete before                                                                         
  claim                                                                                 

  Own claim                  ✓    own only     own only  own only       ---         ---         R
  create/submit                                                                         

  Own claim read             ✓           ✓            ✓         ✓         R           R         R

  Assigned claim           ---      scoped       scoped    scoped         R           R         R
  read                                                                                  

  Assigned claim           ---      scoped       scoped    scoped       ---         ---       ---
  approve                                                                               

  Assigned claim           ---      scoped       scoped    scoped       ---         ---       ---
  return/reject                                                                         

  Finance                  ---         ---          ---       ---         ✓   support\*         R
  queue/review                                                                          

  Verify claim             ---         ---          ---       ---         ✓         ---       ---

  Payment                  ---         ---          ---       ---         ✓    config\*         R
  batch/process                                                                         

  Policy/workflow          ---         ---          ---       ---         R           ✓         R
  manage                                                                                

  Master data              ---         ---          ---       ---         R           ✓         R
  manage                                                                                

  Delegation manage        ---           ✓            ✓         ✓         ✓           ✓         R
  own                                                                                   

  Audit events read        own      scoped       scoped    scoped         ✓           ✓         ✓

  Reports                  own      scoped       scoped    scoped         ✓           ✓         ✓
  -----------------------------------------------------------------------------------------------

`R` = read only. `support*` must be separately granted and audited; it
does not imply ability to approve a user's claim.

## 3. Resource Scope

Authorization requires all of: 1. authenticated active employee; 2.
permission; 3. resource relationship (owner, assigned approver,
finance/admin scope); 4. valid entity state; 5. no segregation-of-duties
conflict.

## 4. Segregation of Duties

-   Claimant cannot approve own claim.
-   Claimant cannot finance-verify own claim.
-   Claimant cannot mark own claim paid.
-   Delegation cannot bypass self-approval.
-   Admin configuration rights do not automatically grant financial
    decision rights.

## 5. Permission Codes

`expense:create`, `expense:read:own`, `expense:update:own`,
`claim:create`, `claim:submit`, `claim:read:own`,
`approval:read:assigned`, `approval:decide:assigned`, `finance:review`,
`finance:verify`, `payment:manage`, `policy:manage`, `workflow:manage`,
`master:manage`, `audit:read`, `report:read`.
