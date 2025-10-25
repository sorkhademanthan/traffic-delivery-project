# SwiftRoute — Chapter 1: Vision & User Stories

Purpose: Define the core goals and needs of our primary users to keep the product focused on real-world value.

## Personas

- Bakery Manager (Admin)
- Delivery Driver (Mobile)

Format: “As a [user], I want to [action], so that I can [goal].”

---

## Bakery Manager (Admin Persona)

- As a Bakery Manager, I want to upload a CSV file of daily orders, so that I don’t have to waste time entering each address manually.
- As a Bakery Manager, I want to view a list of today’s orders with filters (status, zone, priority), so that I can quickly focus on what needs attention.
- As a Bakery Manager, I want to see orders plotted on a map, so that I can visually understand geographic clustering and delivery feasibility.
- As a Bakery Manager, I want to edit order details (address, contact, notes) before routing, so that I can fix errors that would cause failed deliveries.
- As a Bakery Manager, I want to assign selected orders to a specific driver, so that I can balance workloads and meet time windows.
- As a Bakery Manager, I want to trigger route optimization for selected orders, so that I can create the most efficient multi-stop route.
- As a Bakery Manager, I want to review an optimized route summary (distance, ETA, stop sequence), so that I can validate it before dispatching.
- As a Bakery Manager, I want to dispatch the route to a driver’s mobile app, so that the driver can start their delivery run immediately.
- As a Bakery Manager, I want to monitor the driver’s live location on the map, so that I can track progress and proactively manage delays.
- As a Bakery Manager, I want to see real-time stop status updates (pending, en route, delivered, failed), so that I can assess route health at a glance.
- As a Bakery Manager, I want to receive alerts for delays, failed attempts, or deviations, so that I can intervene and keep customers informed.
- As a Bakery Manager, I want to reassign remaining stops to another driver mid-route, so that I can recover from issues like breakdowns or emergencies.
- As a Bakery Manager, I want to view an end-of-day summary (completed, failed, distance, time), so that I can confirm the day’s work is done.
- As a Bakery Manager, I want to export or print a delivery manifest, so that I can keep operational records or share with stakeholders.
- As a Bakery Manager, I want to search historical routes and orders, so that I can resolve customer queries and analyze performance trends.
- As a Bakery Manager, I want to manage driver profiles and availability, so that I can maintain an accurate operational roster.

---

## Delivery Driver (Mobile User Persona)

- As a Delivery Driver, I want to log into the mobile app, so that I can see my assigned route for the day.
- As a Delivery Driver, I want to view my assigned route with an ordered list of stops and ETAs, so that I know exactly where to go and when.
- As a Delivery Driver, I want to see the next stop’s key details (address, contact, notes), so that I can prepare before arrival.
- As a Delivery Driver, I want to start navigation in my preferred maps app from within the route app, so that I can follow step-by-step directions easily.
- As a Delivery Driver, I want to mark a stop as delivered with optional proof (photo/signature), so that I can confirm completion and reduce disputes.
- As a Delivery Driver, I want to mark a stop as attempted/not delivered with a reason, so that I can accurately report issues (no answer, wrong address).
- As a Delivery Driver, I want the app to automatically track and send my GPS location in the background (with consent), so that the manager can see my live progress.
- As a Delivery Driver, I want the app to update my progress and remaining stops in real time, so that I can manage my day efficiently.
- As a Delivery Driver, I want to receive route updates or reassignments during my shift, so that I can adapt to changes without confusion.
- As a Delivery Driver, I want to pause/resume my route (breaks), so that my status reflects reality and ETAs remain accurate.
- As a Delivery Driver, I want the app to continue working offline and sync later, so that I can continue deliveries in areas with poor connectivity.
- As a Delivery Driver, I want to quickly report problems (safety, vehicle issues, blocked roads), so that the manager can assist or adjust the plan.
- As a Delivery Driver, I want to complete my route and view a summary of my day, so that I can confirm I’m done and review my performance.

---

Scope Notes:

- These user stories guide initial scope and acceptance criteria for API, web, and mobile features.
- Stories will be refined into epics, tasks, and test cases in subsequent chapters.
