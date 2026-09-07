# Technical debt and known gaps

| Gap                                                                                                         | Follow-up trigger                                                                                                               |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| ESLint 9 is deprecated, but the installed Next.js plugin chain does not yet declare ESLint 10 compatibility | Upgrade when the complete preset supports the new major                                                                         |
| No CI or deployment                                                                                         | Add the documented checks and local database/browser suites when a hosting workflow is selected                                 |
| Static lint restrictions are not a complete graph or filename checker                                       | Extend enforcement when an observed missed violation justifies it                                                               |
| Real Planning Center credentials have not been supplied                                                     | Validate several real plans against stored source, classifications, and normalized references when credentials become available |
| Synchronous local sync request lifecycle                                                                    | Introduce a durable worker before deploying large imports behind short HTTP timeouts                                            |
| Removed upstream plans are preserved                                                                        | Establish explicit deletion/permission reconciliation before pruning historical records                                         |
| Broad historical filters load paginated joined rows on the server                                           | Profile actual data before changing aggregation placement; never move the full dataset into the browser                         |
| Historical source is a replaceable snapshot, not an audit trail                                             | Add versioned source storage if audit/history requirements arise                                                                |

Current behavior and limits are canonical in [Scripture usage](../architecture/scripture-usage.md)
and [dependency enforcement](../architecture/dependency-rules.md#enforcement).
