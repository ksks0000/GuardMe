# GuardMe
Personal secure web gateway; proxy firewall between an end user and internet

## Background
This project aims to design and implement a personal secure web gateway firewall for an end user, developed as a student project but inspired by real-world cybersecurity architectures.

The system acts as a central security gateway (proxy firewall) positioned between the user and the internet. All browser traffic is routed through this gateway, which performs automated security inspection, monitoring, and decision-making before allowing communication with external services.

Unlike traditional manual scanning tools, the system operates transparently — security checks occur automatically in the background without requiring user interaction.

The platform combines multiple cybersecurity concepts into a modular personal security system:
* Secure proxy firewall controlling all traffic
* Automated link/file reputation scanning via public threat-intelligence APIs
* Local password manager secured by a master credential
* Traffic metadata collection and behavioral analysis
* Personal SIEM-like log aggregation and visualization
* Zero Trust verification principles


The system is deployed inside a local VMware lab environment with a single protected user and a central gateway node.
The goal is a realistic, implementable security architecture demonstrating defensive design using:
- Angular + RxJS (frontend & reactive monitoring)
- NestJS (backend services)
- Dockerized infrastructure
- Database-backed services
- Secure communication principles

HTTPS interception is intentionally excluded to keep implementation feasible while still demonstrating proxy-based protection.
The first version prioritizes a working MVP security platform that can be incrementally expanded.
