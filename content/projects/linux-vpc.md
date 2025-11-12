---
title: "vpcctl: Building AWS VPC on Linux"
description: "A CLI tool that recreates AWS VPC functionality using Linux network namespaces, bridges, and iptables. Build isolated networks, public/private subnets, NAT gateways, and VPC peering on bare Linux."
date: "2025-11-12"
tags: ["infrastructure", "shell", "vpc", "networking", "devops", "cli"]
featured: true
github: "https://github.com/basit-devBE/LinuxVPC"
---

# vpcctl: Building AWS VPC on Linux

I built a command-line tool called `vpcctl` that recreates AWS VPC functionality on Linux using only native primitives — network namespaces, bridges, veth pairs, and iptables. The goal was to make it easy to spin up isolated VPC topologies locally for learning, testing, and demos without touching any cloud APIs.

The tool lets you create VPCs (bridges), add public and private subnets (namespaces), configure NAT gateways for internet access, apply firewall policies, and even set up VPC peering between separate networks. Everything runs on a single Linux host or across multiple hosts with proper routing.

Below is how I built it, the commands it exposes, and the problems I solved along the way.

## High-level architecture

The tool replicates AWS VPC concepts using Linux primitives:

- **VPC** → Linux bridge (acts as router/gateway)
- **Subnet** → Network namespace (isolated network stack)
- **Virtual cables** → veth pairs (connect namespaces to bridge)
- **NAT Gateway** → iptables MASQUERADE rules
- **Security Groups** → iptables firewall rules per namespace
- **VPC Peering** → Static routes between bridges

```
                          ┌─────────────┐
                          │  Internet   │
                          └──────┬──────┘
                                 │ NAT (MASQUERADE)
        ┌────────────────────────┴────────────────────────┐
        │          TestVPC (10.0.0.0/16)                  │
        │            Bridge: br-TestVPC                   │
        │             Gateway: 10.0.0.1                   │
        ├──────────────────┬──────────────────────────────┤
        │                  │                              │
 ┌──────▼──────────┐  ┌───▼────────────┐         ┌───────────┐
 │ Public Subnet   │  │ Private Subnet │◄────────┤  Peering  │
 │  10.0.1.0/24    │  │  10.0.2.0/24   │         │  Connection│
 │                 │  │                │         └─────┬─────┘
 │ ✓ NAT Gateway   │  │ ✗ No Internet  │               │
 │ ✓ HTTP/HTTPS    │  │ ✓ MySQL (3306) │               │
 │ ✓ SSH (VPC)     │  │ ✓ SSH (Public) │               │
 └─────────────────┘  └────────────────┘               │
                                                        │
        ┌───────────────────────────────────────────────┘
        │
        │          VPC2 (192.168.0.0/16)
        │            Bridge: br-VPC2
        │
        └──────────► 192.168.1.0/24 (web subnet)
```

## How it works

The tool is organized as a main CLI (`vpcctl`) and small Bash modules in `lib/`:

- `common.sh` — logging, argument parsing, sudo handling
- `vpc.sh` — create/destroy VPC bridges
- `subnet.sh` — create/delete subnets (namespaces + veths)
- `routing.sh` — configure IP forwarding and routes
- `firewall.sh` — apply iptables/nftables rules
- `peering.sh` — set up VPC peering with static routes

Each operation is idempotent: check if resource exists, create only if missing, record state in `config/vpc.conf`. This makes commands safe to re-run.

## Challenges I hit (and what I learned)

### 1. Namespace isolation vs connectivity

Initially, I created namespaces but forgot to set default routes inside them. Ping to the gateway worked, but pinging other subnets failed. The fix was to add a default route in each namespace pointing to the bridge gateway.

Lesson: Namespaces have completely isolated routing tables. You must explicitly configure routes even if interfaces are connected.

### 2. NAT rules not applying idempotently

When I ran `create-subnet` multiple times, duplicate NAT rules piled up in iptables. This caused performance issues and confusing rule lists.

Fix: Use `iptables -C` to check if a rule exists before adding it:

```bash
iptables -t nat -C POSTROUTING -s 10.0.1.0/24 -j MASQUERADE 2>/dev/null || \
  iptables -t nat -A POSTROUTING -s 10.0.1.0/24 -j MASQUERADE
```

This pattern made all operations idempotent — safe to re-run without side effects.

### 3. nftables vs iptables compatibility

Different Linux distros use different firewall backends. Newer systems use nftables, older ones use iptables. Commands are not compatible.

Fix: Detect which is available at runtime:

```bash
if command -v nft >/dev/null 2>&1; then
    # use nft commands
else
    # use iptables commands
fi
```

This made the tool portable across Ubuntu, Fedora, and Arch.

### 4. VPC peering route conflicts

When peering two VPCs with overlapping CIDRs (e.g., both using 10.0.0.0/16), routing broke. One VPC's routes shadowed the other's.

Fix: I enforced CIDR uniqueness checks in the peering logic. The tool now refuses to peer VPCs with overlapping address spaces.

Lesson: AWS prevents overlapping CIDRs in VPC peering for good reason. I replicated that validation.

### 5. State file corruption

If the tool crashed mid-operation, `vpc.conf` sometimes had partial entries or duplicate lines. This broke subsequent list operations.

Fix: Use atomic writes — write to a temp file, then `mv` it over the original:

```bash
echo "$new_entry" >> /tmp/vpc.conf.tmp
mv /tmp/vpc.conf.tmp config/vpc.conf
```

This ensured state updates were all-or-nothing.

## What I'd improve next

- **Multi-host peering with tunnels**: Right now cross-host peering requires manual static routes. I'd add automatic VPN/tunnel setup (WireGuard or VXLAN) so VPCs on different hosts can communicate seamlessly.

- **DHCP for subnets**: Currently, IPs are statically assigned (`10.0.1.10`). Adding a lightweight DHCP server would make it more cloud-like where instances get IPs dynamically.

- **Web UI or TUI**: A terminal UI (using something like `dialog` or `whiptail`) would make it easier to visualize VPC topologies and manage resources interactively.

- **Kubernetes CNI mode**: Package the tool as a CNI plugin so it can provision network namespaces for Kubernetes pods, replicating VPC-style isolation in K8s.

- **Logging and metrics**: Add structured logging and export metrics (namespace count, packet counters from iptables) to Prometheus for monitoring.

## Closing thoughts

Building `vpcctl` taught me more about Linux networking than any tutorial could. Implementing VPC concepts from scratch — namespaces, bridges, veth pairs, NAT, routing, and firewalling — forced me to understand what each piece does and why it matters.

The most valuable lesson: cloud abstractions like AWS VPC aren't magic. They're thin layers over well-understood primitives that have existed in Linux for decades. Once you understand the primitives, you can build your own abstractions.

If you're learning networking or DevOps, I highly recommend building something like this. It's messy, you'll hit weird bugs (RTNETLINK errors, routing loops, firewall drops), but solving them gives you intuition that's hard to get from reading docs.

The tool is open source and available on GitHub. Try it out, break it, improve it. That's how I learned.

## Using vpcctl: Step-by-step walkthrough

Below is the walkthrough of how to use `vpcctl` to build a complete VPC topology with public and private subnets, NAT gateway, and VPC peering. I explain what each command does and what happens under the hood.

### 1. Create a VPC

First, I create a VPC with a CIDR block. This sets up the bridge and gateway.

```bash
sudo ./vpcctl create-vpc --name AppVPC --cidr 10.0.0.0/16
```

What this does:
- Creates a Linux bridge `br-AppVPC`
- Assigns gateway IP `10.0.0.1/16` to the bridge
- Records VPC state in `config/vpc.conf`
- Enables IP forwarding globally (`sysctl net.ipv4.ip_forward=1`)

The bridge acts as the VPC router. All subnets will attach to this bridge via veth pairs. Without the bridge, namespaces can't communicate with each other.

### 2. Create a public subnet

Next, I add a public subnet that will have internet access via NAT.

```bash
sudo ./vpcctl add-subnet \
    --vpc AppVPC \
    --name web \
    --cidr 10.0.1.0/24 \
    --type public
```

What this does:
- Creates a network namespace `AppVPC-web`
- Creates a veth pair and attaches one end to the namespace, one end to the bridge
- Assigns IP `10.0.1.10/24` inside the namespace
- Sets default route in the namespace pointing to the bridge gateway
- **Adds NAT rule**: `iptables -t nat -A POSTROUTING -s 10.0.1.0/24 -j MASQUERADE`
- Records subnet state

The `--type public` is key: it adds the MASQUERADE rule so traffic from this subnet can reach the internet. The source IP is rewritten to the host's public IP, just like an AWS NAT gateway.

### 3. Create a private subnet

Now I add a private subnet without direct internet access.

```bash
sudo ./vpcctl add-subnet \
    --vpc AppVPC \
    --name database \
    --cidr 10.0.2.0/24 \
    --type private
```

What this does:
- Creates namespace `AppVPC-database`
- Creates veth pair and attaches to bridge
- Assigns IP `10.0.2.10/24` inside the namespace
- Sets default route pointing to the bridge gateway
- **No NAT rule** — this subnet can't reach the internet directly
- Can communicate with other subnets in the same VPC via the bridge

Private subnets can still talk to public subnets (both are on the same bridge), but they have no MASQUERADE rule. If you try to ping `8.8.8.8` from the private subnet, it will fail.

### 4. List VPCs and subnets

Check what's been created:

```bash
sudo ./vpcctl list-vpcs
sudo ./vpcctl list-subnets
```

This reads `config/vpc.conf` and shows all VPCs, their CIDR blocks, bridges, and subnets. The state file looks like:

```
VPC:AppVPC:10.0.0.0/16:br-AppVPC:1762964516
SUBNET:AppVPC:web:10.0.1.0/24:public:AppVPC-web:1762964605
SUBNET:AppVPC:database:10.0.2.0/24:private:AppVPC-database:1762964738
```

This makes it easy to track resources and avoid name collisions.

### 5. Test connectivity between subnets

To verify the VPC works, I execute commands inside the namespaces:

```bash
# Start a web server in the database subnet
sudo ip netns exec AppVPC-database python3 -m http.server 8000 &

# From the web subnet, curl the database subnet
sudo ip netns exec AppVPC-web curl -f http://10.0.2.10:8000
```

`ip netns exec AppVPC-web` runs the command inside the `AppVPC-web` namespace. If the curl succeeds, traffic is flowing between subnets via the bridge.

This confirms:
- veth pairs are connected
- Bridge is forwarding packets
- Routing is configured correctly

### 6. Apply firewall policies

I can define security groups in `config/security-groups.json` and apply them:

```bash
sudo ./vpcctl apply-firewall --strict
```

What this does:
- Reads JSON policies from `config/security-groups.json`
- For each subnet, applies iptables rules inside the namespace
- `--strict` sets default policy to DROP, then allows only specified ports
- Example: allow HTTP (80), HTTPS (443), SSH (22) from specific sources

Sample policy:

```json
{
  "policies": [
    {
      "subnet": "10.0.1.0/24",
      "ingress": [
        {
          "port": 80,
          "protocol": "tcp",
          "source": "0.0.0.0/0",
          "action": "allow"
        }
      ]
    }
  ]
}
```

The tool detects whether the system uses iptables or nftables and applies the right commands.

### 7. Create VPC peering

To connect two VPCs, I use peering:

```bash
# Create a second VPC
sudo ./vpcctl create-vpc --name PartnerVPC --cidr 192.168.0.0/16
sudo ./vpcctl add-subnet --vpc PartnerVPC --name api --cidr 192.168.1.0/24 --type public

# Peer the two VPCs
sudo ./vpcctl peer-vpcs --vpc1 AppVPC --vpc2 PartnerVPC
```

What this does:
- Creates veth pairs connecting the two bridges: `vp-AppVPC` ↔ `vp-PartnerVPC`
- Assigns IPs to the peering interfaces
- Adds static routes on each bridge to reach the other VPC's CIDR

Now subnets in `AppVPC` can reach subnets in `PartnerVPC` and vice versa.

To test:

```bash
# From AppVPC-web, ping PartnerVPC-api
sudo ip netns exec AppVPC-web ping -c 3 192.168.1.10
```

If the ping succeeds, VPC peering is working.

### 8. Delete resources

To tear down a VPC:

```bash
sudo ./vpcctl delete-vpc --name AppVPC
```

What this does:
- Deletes all subnets (namespaces and veths)
- Removes NAT rules for public subnets
- Deletes the bridge
- Cleans up state file entries

The tool handles cleanup in the right order to avoid errors.

## How I built vpcctl: The implementation

Below is how I actually implemented the tool — the technical decisions, the low-level Linux commands it wraps, and the patterns I used to make it reliable.

### The modular structure

I organized the code into small, focused Bash modules:

```
lib/
├── common.sh      # logging, argument parsing, sudo wrapper
├── vpc.sh         # VPC (bridge) management
├── subnet.sh      # subnet (namespace + veth) management
├── routing.sh     # IP forwarding and route configuration
├── firewall.sh    # iptables/nftables rule management
└── peering.sh     # VPC peering with static routes
```

The main `vpcctl` script sources these modules and routes commands to the right functions. This kept each module under 200 lines and made testing easier.

### Creating a VPC (bridge setup)

When you run `create-vpc --name AppVPC --cidr 10.0.0.0/16`, the tool runs:

```bash
# Create the bridge
ip link add br-AppVPC type bridge

# Assign gateway IP
ip addr add 10.0.0.1/16 dev br-AppVPC

# Bring it up
ip link set br-AppVPC up

# Enable IP forwarding globally
sysctl -w net.ipv4.ip_forward=1

# Record state
echo "VPC:AppVPC:10.0.0.0/16:br-AppVPC:$(date +%s)" >> config/vpc.conf
```

The bridge is the VPC router. All subnets attach to this bridge, and it forwards packets between them.

### Creating subnets (namespaces + veth pairs)

#### Public subnet creation

When you run `add-subnet --vpc AppVPC --name web --cidr 10.0.1.0/24 --type public`, the tool does this:

1) **Create the namespace**:
```bash
ip netns add AppVPC-web
```

2) **Create veth pair** (virtual cable with two ends):
```bash
ip link add veth-web type veth peer name veth-web-br
```

3) **Move one end into the namespace**:
```bash
ip link set veth-web netns AppVPC-web
```

4) **Assign IP inside the namespace**:
```bash
ip netns exec AppVPC-web ip addr add 10.0.1.10/24 dev veth-web
ip netns exec AppVPC-web ip link set veth-web up
ip netns exec AppVPC-web ip link set lo up
```

5) **Attach the other end to the bridge**:
```bash
ip link set veth-web-br master br-AppVPC
ip link set veth-web-br up
```

6) **Add default route inside the namespace**:
```bash
ip netns exec AppVPC-web ip route add default via 10.0.0.1
```

This points all traffic from the namespace to the bridge gateway.

7) **If public subnet, add NAT**:
```bash
iptables -t nat -A POSTROUTING -s 10.0.1.0/24 -o eth0 -j MASQUERADE
```

This rewrites the source IP for outgoing packets so the subnet can reach the internet.

#### Private subnet creation

When you run `add-subnet --vpc AppVPC --name db --cidr 10.0.2.0/24 --type private`, the process is almost identical:

1) **Create the namespace**:
```bash
ip netns add AppVPC-db
```

2) **Create veth pair**:
```bash
ip link add veth-db type veth peer name veth-db-br
```

3) **Move one end into the namespace**:
```bash
ip link set veth-db netns AppVPC-db
```

4) **Assign IP inside the namespace**:
```bash
ip netns exec AppVPC-db ip addr add 10.0.2.10/24 dev veth-db
ip netns exec AppVPC-db ip link set veth-db up
ip netns exec AppVPC-db ip link set lo up
```

5) **Attach the other end to the bridge**:
```bash
ip link set veth-db-br master br-AppVPC
ip link set veth-db-br up
```

6) **Add default route inside the namespace**:
```bash
ip netns exec AppVPC-db ip route add default via 10.0.0.1
```

7) **Skip NAT for private subnets**:

The key difference: I do NOT add the MASQUERADE rule. This means the private subnet can communicate with other subnets in the VPC (via the bridge), but it cannot reach the internet directly.

If you want private subnets to reach the internet, you'd route their traffic through a NAT instance in a public subnet. I left that as an optional feature.

### Making operations idempotent

I needed the tool to be safe to re-run. If you run `create-vpc` twice, it shouldn't fail or create duplicates.

Pattern I used:

```bash
create_vpc() {
    local name=$1
    
    # Check if bridge already exists
    if ip link show br-$name >/dev/null 2>&1; then
        log_info "VPC $name already exists"
        return 0
    fi
    
    # Create it
    ip link add br-$name type bridge
    # ... rest of setup
}
```

For iptables, I check before adding:

```bash
iptables -t nat -C POSTROUTING -s 10.0.1.0/24 -j MASQUERADE 2>/dev/null || \
  iptables -t nat -A POSTROUTING -s 10.0.1.0/24 -j MASQUERADE
```

The `-C` checks if the rule exists. If it does, the `||` short-circuits and we don't add a duplicate.

### Handling nftables vs iptables

Newer distros use nftables, older ones use iptables. I detect which is available:

```bash
if command -v nft >/dev/null 2>&1; then
    FW_BACKEND=nft
else
    FW_BACKEND=iptables
fi
```

Then I route through wrapper functions:

```bash
add_nat_rule() {
    local subnet=$1
    local interface=$2
    
    if [ "$FW_BACKEND" = nft ]; then
        nft add rule ip nat POSTROUTING ip saddr $subnet oifname "$interface" masquerade
    else
        iptables -t nat -C POSTROUTING -s "$subnet" -o "$interface" -j MASQUERADE 2>/dev/null || \
          iptables -t nat -A POSTROUTING -s "$subnet" -o "$interface" -j MASQUERADE
    fi
}
```

This kept the high-level code simple and portable.

### VPC peering implementation

When you run `peer-vpcs --vpc1 AppVPC --vpc2 PartnerVPC`, the tool connects the two bridges:

1) **Create veth pair between bridges**:
```bash
ip link add vp-AppVPC type veth peer name vp-PartnerVPC
```

2) **Attach one end to each bridge**:
```bash
ip link set vp-AppVPC master br-AppVPC
ip link set vp-PartnerVPC master br-PartnerVPC
```

3) **Bring both up**:
```bash
ip link set vp-AppVPC up
ip link set vp-PartnerVPC up
```

4) **Add routes so each VPC knows how to reach the other**:
```bash
# From AppVPC (10.0.0.0/16), route to PartnerVPC (192.168.0.0/16)
ip route add 192.168.0.0/16 via 10.0.0.1 dev br-AppVPC

# From PartnerVPC, route back to AppVPC
ip route add 10.0.0.0/16 via 192.168.0.1 dev br-PartnerVPC
```

Now subnets in both VPCs can talk to each other via the peering connection.

### State management

I track everything in `config/vpc.conf`:

```
VPC:AppVPC:10.0.0.0/16:br-AppVPC:1762964516
SUBNET:AppVPC:web:10.0.1.0/24:public:AppVPC-web:1762964605
PEERING:AppVPC:PartnerVPC:vp-AppVPC:vp-PartnerVPC:1762939717
```

Format: `TYPE:field1:field2:...:timestamp`

When you run `list-vpcs`, the tool parses this file. When you delete resources, it removes the matching lines. I use `grep -v` for deletion and atomic writes (temp file + `mv`) to avoid corruption.

### Firewall policies from JSON

I defined security groups in JSON:

```json
{
  "policies": [
    {
      "subnet": "10.0.1.0/24",
      "ingress": [
        { "port": 80, "protocol": "tcp", "source": "0.0.0.0/0", "action": "allow" },
        { "port": 443, "protocol": "tcp", "source": "0.0.0.0/0", "action": "allow" }
      ]
    }
  ]
}
```

The `apply-firewall` command reads this with `jq` and generates iptables rules:

```bash
# Set default DROP policy
ip netns exec AppVPC-web iptables -P INPUT DROP

# Allow specific ports
ip netns exec AppVPC-web iptables -A INPUT -p tcp --dport 80 -j ACCEPT
ip netns exec AppVPC-web iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Allow established connections
ip netns exec AppVPC-web iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
```

This replicates AWS security groups.

### Logging and error handling

Every function logs to both console and `logs/vpcctl.log`:

```bash
log_info() {
    echo "[INFO] $1" | tee -a logs/vpcctl.log
}

log_error() {
    echo "[ERROR] $1" >&2 | tee -a logs/vpcctl.log
}
```

I use `set -euo pipefail` at the top of each script so any error stops execution immediately. This prevents partial state.

### Sudo handling

Most operations require root. I added a wrapper in `common.sh`:

```bash
require_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "This command requires root privileges. Run with sudo."
        exit 1
    fi
}
```

Each command calls `require_root` at the start.

## Lessons and small improvements I made along the way

- Favor small, focused test scripts. They made debugging network issues 10× faster.
- Keep state recorded (json) in `stage4/.state/` so scripts can show what exists without parsing `ip` output every time.
- Use short health checks and timeouts in tests to avoid long waits during demos.
