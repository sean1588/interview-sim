// The AWS course: per-module lesson files assembled into a Course. This is a
// *concept* course — it declares no `language`, so it has no editor and no
// exercises (see Course.language in ../types); every lesson is taught
// conversationally by the voice tutor against its notes.
//
// Audience: engineers who ship software but have never been the one choosing
// which AWS services to build on. The course is organized by service category
// rather than by scenario, and every lesson follows the same arc: what the
// service actually is, how it works underneath, the common use cases it earns,
// when it's the WRONG reach, and the neighbouring service people confuse it
// with. Where a lesson overlaps the concept library, it links to the article
// rather than restating it: the library explains the general mechanism, this
// course explains which AWS product implements it and what that costs.

import type { Course, Lesson, Module } from "../types";
import { foundationsLessons } from "./foundations";
import { computeLessons } from "./compute";
import { storageLessons } from "./storage";
import { databasesLessons } from "./databases";
import { networkingLessons } from "./networking";
import { messagingLessons } from "./messaging";
import { operationsLessons } from "./operations";

const MODULES: Module[] = [
  { id: "foundations", title: "Foundations", blurb: "Regions, Availability Zones and edge; IAM as the front door to every single API call; and the shared-responsibility line that decides what's still your job." },
  { id: "compute", title: "Compute", blurb: "EC2 instances you operate, Lambda functions you don't, containers on ECS/Fargate/EKS, and the autoscaling metric that decides whether any of it keeps up." },
  { id: "storage", title: "Storage", blurb: "S3 as infrastructure, EBS and EFS for when you need a real filesystem, and the storage classes that cut the bill by 20x if you read the retrieval terms." },
  { id: "databases", title: "Databases & Analytics", blurb: "RDS and Aurora for relational, DynamoDB's access-pattern-first modeling, ElastiCache in front of both, and the columnar path through Athena and Redshift." },
  { id: "networking", title: "Networking & Delivery", blurb: "VPC subnets and the two firewalls, ALB vs NLB, Route 53 as a routing layer, CloudFront at the edge, and API Gateway as the managed front door." },
  { id: "messaging", title: "Messaging & Events", blurb: "SQS queues and visibility timeouts, SNS fan-out, EventBridge's content routing, Kinesis streams you can rewind, and Step Functions for workflows that must not get lost." },
  { id: "operations", title: "Security & Operations", blurb: "KMS envelope encryption and rotating secrets, the three observability services and which question each answers, and infrastructure as code." },
];

const LESSONS: Lesson[] = [
  ...foundationsLessons,
  ...computeLessons,
  ...storageLessons,
  ...databasesLessons,
  ...networkingLessons,
  ...messagingLessons,
  ...operationsLessons,
];

export const awsCourse: Course = {
  id: "aws",
  // No `language`: a concept course — conversational lessons, no editor. Its
  // tutor persona is keyed off this id in CONCEPT_PROFILE (@/lib/prompts).
  title: "AWS",
  tagline: "A guided tour of the AWS services you'll actually be asked about — what each one is for, what it costs you, and when it's the wrong reach.",
  icon: "☁️",
  modules: MODULES,
  lessons: LESSONS,
};
