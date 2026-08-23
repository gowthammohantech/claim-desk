# Claim Desk --- Screen Inventory

**Version:** 1.0

## 1. Mobile Screens

  --------------------------------------------------------------------------------------------
  ID             Screen          Primary Actor       Key Functions              Source
  -------------- --------------- ------------------- -------------------------- --------------
  M-001          Home            Employee/Approver   reimbursement summary,     Prototype
                                                     quick actions, smart       
                                                     checks, recent expenses,   
                                                     notifications              

  M-002          Expenses        Employee            unclaimed/draft/in-claim   Prototype
                                                     expenses, select lines,    
                                                     create claim               

  M-003          Claim Review &  Employee            title, selected lines,     Prototype
                 Submit                              total, policy/duplicate    
                                                     warnings, declaration,     
                                                     submit                     

  M-004          Claims          Employee            claim list, statuses,      Prototype
                                                     amount, current stage      

  M-005          Claim Detail    Employee            claim header, lines,       Prototype
                                                     engagement, status         
                                                     timeline, payment status   

  M-006          Receipt Scanner Employee            camera capture/gallery     Prototype
                                                     input                      

  M-007          OCR Review      Employee            extracted fields,          Prototype
                                                     confidence,                
                                                     classification,            
                                                     engagement, purpose,       
                                                     policy result              

  M-008          Manual Expense  Employee            create expense without     Prototype
                                                     scan                       

  M-009          Mileage Expense Employee            distance, rate,            Prototype
                                                     classification,            
                                                     engagement, purpose        

  M-010          Policy          Employee            limit comparison, rule ID, Prototype
                 Exception                           justification              

  M-011          Duplicate       Employee            compare candidate          Prototype
                 Resolution                          expenses, discard/keep     
                                                     with audit note            

  M-012          Approvals       Approver            assigned pending claims,   Prototype
                                                     SLA/age, exception         
                                                     indicators                 

  M-013          Approval Detail Approver            employee, engagement,      Prototype
                                                     lines, exceptions,         
                                                     approve/return/reject      

  M-014          Notifications   Employee/Approver   approval, return, finance, Prototype
                                                     payment and reminder       
                                                     notifications              

  M-015          Profile         Employee            identity, grade,           Prototype
                                                     department, branch,        
                                                     manager, masked            
                                                     bank/payment data, SSO     

  M-016          Expense         Employee            inspect/edit               Required by
                 Detail/Edit                         draft/unclaimed expense;   FRD; missing
                                                     receipt preview            in prototype

  M-017          Receipt Preview Employee/Approver   secure receipt             Required by
                                                     preview/download metadata  workflow;
                                                                                missing in
                                                                                prototype

  M-018          Returned Claim  Employee            view return reason, edit   Required by
                 Correction                          eligible lines, resubmit   lifecycle;
                                                                                missing in
                                                                                prototype

  M-019          Delegation      Approver            view/create allowed        FRD
                                                     delegation                 requirement;
                                                                                missing in
                                                                                prototype

  M-020          Offline/Sync    Employee            local drafts, pending      TDD
                 State                               upload, retry state        requirement;
                                                                                missing in
                                                                                prototype
  --------------------------------------------------------------------------------------------

## 2. Finance/Admin Web Screens

  -----------------------------------------------------------------------------------------------
  ID                Screen              Actor                Key Functions
  ----------------- ------------------- -------------------- ------------------------------------
  W-001             Sign In             All web users        SSO

  W-002             Finance Dashboard   Finance              pending verification, aging,
                                                             payment-ready totals

  W-003             Finance Queue       Finance              filter/sort claims awaiting review

  W-004             Finance Claim       Finance              evidence, lines, GL/cost centre/GST,
                    Review                                   verify/return

  W-005             Payment Batches     Finance              create/view batches, eligible
                                                             verified claims

  W-006             Payment Batch       Finance              claim totals, payment references,
                    Detail                                   mark paid/import result

  W-007             Employees           Admin                employee sync/view/status/role scope

  W-008             Clients             Admin                client master

  W-009             Engagements         Admin                engagement
                                                             assignment/status/manager/partner

  W-010             Expense Categories  Admin                categories and receipt defaults

  W-011             Policy List         Admin                policy versions/status/effective
                                                             dates

  W-012             Policy Editor       Admin                conditions/actions/precedence/test

  W-013             Workflow List       Admin                workflow versions

  W-014             Workflow Editor     Admin                route conditions, stages, SLA,
                                                             escalation

  W-015             Delegations         Admin                delegated approver windows

  W-016             Reports             Finance/Management   employee, engagement, category,
                                                             exception, aging, payment

  W-017             Audit Explorer      Auditor/Admin        event filters and
                                                             before/after/context

  W-018             Integration Monitor Admin                HR/OCR/accounting sync status and
                                                             retries

  W-019             Settings            Admin                firm-level configuration

  W-020             Access/Permission   Admin                role assignments and scoped
                    Admin                                    permissions
  -----------------------------------------------------------------------------------------------

## 3. Mobile Navigation

Main tabs: Home, Expenses, Claims, Approvals, Profile. Approvals tab is
visible only when the user has an approver permission. Secondary screens
are stack routes or modal/sheet flows.

## 4. Prototype Alignment

The attached ClaimDesk v2 prototype implements 15 named mobile views and
demonstrates scan -\> OCR -\> expense, expenses -\> claim -\> submit,
claim timeline, approval decisions, exception justification and
duplicate handling. Additional screens above close FRD/TDD lifecycle
gaps rather than changing the prototype's primary navigation.
