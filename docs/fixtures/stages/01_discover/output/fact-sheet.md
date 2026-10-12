# Fact Sheet (fixture)

## purpose
| ID | Claim | Source |
| --- | --- | --- |
| F001 | The kit turns recurring work into staged runs a person reviews at every step. | `sources/01-example-kit/README.md` §Purpose |
| F002 | The operator runs and reviews every stage. | `sources/01-example-kit/docs/design.md` §Flow |

## components
| ID | Claim | Source |
| --- | --- | --- |
| F003 | Templates hold stage contracts and shared standards. | `sources/01-example-kit/README.md` §Parts |
| F004 | Instances are single runs created from a template. | `sources/01-example-kit/README.md` §Parts |
| F005 | The knowledge library keeps archived runs. | `sources/01-example-kit/README.md` §Parts |
| F006 | Stages call a hosted model. | `sources/01-example-kit/docs/design.md` §Flow |

## what-it-does
| ID | Claim | Source |
| --- | --- | --- |
| F013 | Templates define the stages of a workflow. | `sources/01-example-kit/README.md` §Parts |
| F014 | Templates hold the standards every run follows. | `sources/01-example-kit/README.md` §Parts |
| F015 | Templates change only through review. | `sources/01-example-kit/docs/design.md` §Why templates and instances are separate |
| F016 | Instances hold one run's stages and outputs. | `sources/01-example-kit/README.md` §Parts |
| F017 | Instances are created from a template. | `sources/01-example-kit/README.md` §Parts |
| F018 | Instances are disposable once archived. | `sources/01-example-kit/docs/design.md` §Why templates and instances are separate |

## segmentation
| ID | Claim | Source |
| --- | --- | --- |
| F007 | Templates change through review; runs must not change them. | `sources/01-example-kit/docs/design.md` §Why templates and instances are separate |

## structure
| ID | Claim | Source |
| --- | --- | --- |
| F008 | Each stage has a contract file listing inputs, process, and outputs. | `sources/01-example-kit/templates/demo/stages/01_draft/CONTEXT.md` |
| F009 | Templates are versioned on a code host. (inferred) | `sources/01-example-kit/templates/demo/status.yml` |

## usage
| ID | Claim | Source |
| --- | --- | --- |
| F010 | A run starts when the operator opens a session. | `sources/01-example-kit/docs/design.md` §Flow |
| F011 | The stage contract loads, the stage runs, and output is written. | `sources/01-example-kit/docs/design.md` §Flow |
| F012 | The operator reviews the output before the next stage. | `sources/01-example-kit/docs/design.md` §Flow |
