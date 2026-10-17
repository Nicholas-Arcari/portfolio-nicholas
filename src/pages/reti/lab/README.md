# Laboratorio di Reti dei Calcolatori

```
  _           _                     _             _
 | |         | |                   | |           (_)
 | |     __ _| |__   ___  _ __ __ _| |_ ___  _ __ _  ___
 | |    / _` | '_ \ / _ \| '__/ _` | __/ _ \| '__| |/ _ \
 | |___| (_| | |_) | (_) | | | (_| | || (_) | |  | | (_) |
 |______\__,_|_.__/ \___/|_|  \__,_|\__\___/|_|  |_|\___/

  ____      _   _     _      _    ____      _            _       _             _
 |  _ \ ___| |_(_)   __| | ___(_)  / ___|__ _| | ___ ___ | | __ _| |_ ___  _ __(_)
 | |_) / _ \ __| |  / _` |/ _ \ | | |   / _` | |/ __/ _ \| |/ _` | __/ _ \| '__| |
 |  _ <  __/ |_| | | (_| |  __/ | | |__| (_| | | (_| (_) | | (_| | || (_) | |  | |
 |_| \_\___|\__|_|  \__,_|\___|_|  \____\__,_|_|\___\___/|_|\__,_|\__\___/|_|  |_|
```

**Corso**: Reti dei Calcolatori - A.A. 2024/2025  
**Docente**: Prof. Roberto Alfieri  
**Universita'**: Universita' degli Studi di Parma  
**Studente**: Arcari Nicholas  
**Ambiente**: Kali Linux

---

## Contenuto della Repository

Ogni file corrisponde a un'esercitazione di laboratorio, documentata con i comandi eseguiti, i relativi output e un'analisi tecnica a basso livello delle operazioni di rete e sicurezza coinvolte.

| # | File | Argomento | Temi chiave |
|---|------|-----------|-------------|
| 01 | [01-docker.txt](01-docker.txt) | Docker: fondamenti | Daemon, immagini, container, nginx-ssh, namespaces, cgroups, overlay FS |
| 02 | [02-netSniffing.txt](02-netSniffing.txt) | Network Sniffing | Volumi Docker, tcpdump, Wireshark, analisi TCP, cattura pacchetti |
| 03 | [03-ip-statico.txt](03-ip-statico.txt) | IP Statico e Port Forwarding | Bridge user-defined, IPAM, DNAT, iptables NAT, compose.yml |
| 04 | [04-routing.txt](04-routing.txt) | Docker Routing | Routing inter-VLAN, ip_forward, FIB, tabelle di routing, privileged mode |
| 05 | [05-programmazione-di-rete.txt](05-programmazione-di-rete.txt) | Programmazione di Rete | Socket UDP/TCP, gethostbyname, client-server, threading |
| 06 | [06-http.txt](06-http.txt) | HTTP e NGINX | Virtual hosting, configurazione NGINX, CGI, PHP, event-driven model |
| 07 | [07-firewall.txt](07-firewall.txt) | Firewall con iptables | Netfilter, chain FORWARD, stateful inspection, conntrack, default deny |
| 08 | [08-openSSL.txt](08-openSSL.txt) | OpenSSL e Crittografia | Base64, AES-256-CBC, MD5, HMAC-SHA256, RSA-2048, firma digitale |
| 09 | [09-https.txt](09-https.txt) | HTTPS e TLS | Certificati X.509, self-signed, TLS handshake, virtual host SSL |
| opz | [opz-IPv6.txt](opz-IPv6.txt) | IPv6 | Indirizzi Global/Link-Local, dual-stack, NDP, EUI-64, nmap IPv6 |
| opz | [opz-wifi.txt](opz-wifi.txt) | WiFi | 802.11, WPA2, scansione rete, tcpdump wireless, inter-host SSH |

---

## Stack Tecnologico

- **Container**: Docker Engine 20.10, Docker Compose v1/v2
- **Immagine base**: `cyberteam1/nginx-ssh` (NGINX + OpenSSH Server)
- **Networking**: Linux bridge, veth pairs, iptables/netfilter, IPv4/IPv6
- **Analisi di rete**: tcpdump, Wireshark, nmap, traceroute, dig, whois
- **Crittografia**: OpenSSL (AES-256-CBC, RSA-2048, SHA-256, HMAC, X.509)
- **Programmazione**: Python 3 (socket UDP/TCP, client-server, threading)
- **Web server**: NGINX (virtual hosting, SSL/TLS, reverse proxy)

---

## Topologia di Rete

Le esercitazioni costruiscono progressivamente topologie di rete Docker sempre piu' complesse:

```
  Lab 01-02: Single bridge (default docker0)
  ┌──────────┐     ┌──────────┐
  │   ns2    │─────│   ns3    │   bridge: 172.17.0.0/16
  └──────────┘     └──────────┘

  Lab 03: Bridge user-defined con IP statico + port forwarding
  Host:2006 ──DNAT──> ns11:22    bridge1: 172.21.0.0/24
  Host:8006 ──DNAT──> ns11:80

  Lab 04: Inter-VLAN routing
  ┌──────┐         ┌──────┐         ┌──────┐
  │  ns8 │──bridge1──│  ns9 │──bridge2──│ ns10 │
  │.1.2  │  10.0.1.0 │.1.3  │  10.0.2.0 │.2.4  │
  └──────┘   /24    │.2.3  │   /24    └──────┘
                    └──────┘
                   (router)

  Lab 07: Firewall (iptables su ns3)
  ns2 ──[bridge1]──> ns3 (FORWARD rules) ──[bridge2]──> ns4
       10.0.1.0/24   firewall: DROP policy    10.0.2.0/24
                     ACCEPT: SSH(22), HTTP(80)
```

---

## Analisi a Basso Livello

Ogni file include sezioni `[Analisi a basso livello]` che approfondiscono:

- **Kernel Linux**: namespaces (PID, NET, MNT, UTS, IPC), cgroups, ip_forward, FIB, netfilter
- **Protocolli di rete**: TCP three-way handshake, UDP datagrammi, ICMP, ARP/NDP, DNS, HTTP/HTTPS
- **Sicurezza**: cifratura simmetrica/asimmetrica, firme digitali, TLS handshake, certificate chain, iptables stateful filtering
- **Docker internals**: overlay filesystem, veth pairs, bridge networking, DNAT/SNAT, container isolation

---

## Come Utilizzare

```bash
# Avviare Docker
sudo service docker start

# Esempio: laboratorio routing (Lab 04)
cd dockerRouting/
docker-compose up -d
docker exec -it ns8 bash
```

---

## Note

- I file sono in formato `.txt` per compatibilita' con il server didattica-linux dell'universita'.
- Gli output dei comandi sono riportati fedelmente come eseguiti durante le sessioni di laboratorio.
- Le password e le matricole sono state sostituite con placeholder per sicurezza.
- Le catture di rete (.pcap) sono escluse dalla repository tramite `.gitignore`.
