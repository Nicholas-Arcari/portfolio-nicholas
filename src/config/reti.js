// src/config/reti.js
// Le esercitazioni del laboratorio di Reti di Calcolatori (laurea triennale,
// Universita' di Parma), una riga ciascuna nell'elenco di
// /reti-di-calcolatori. I testi sono la copia esatta dei file del repository
// del laboratorio, in pages/reti/lab (README compreso): per aggiornarli si
// ricopiano i file, e la descrizione in italiano di ogni riga si rilegge da
// sola dalla tabella del README. Qui stanno solo il nome della riga,
// l'indirizzo e la descrizione in inglese.

export const RETI_REPO = 'https://github.com/Nicholas-Arcari/laboratorio-reti-dei-calcolatori';

export const RETI_LAB = [
  {
    slug: 'esercizio-1',
    file: '01-docker.txt',
    name: 'Esercizio #1 - docker',
    en: 'Docker: fundamentals. Daemon, images, containers, nginx-ssh, namespaces, cgroups, overlay FS.',
  },
  {
    slug: 'esercizio-2',
    file: '02-netSniffing.txt',
    name: 'Esercizio #2 - netSniffing',
    en: 'Network sniffing. Docker volumes, tcpdump, Wireshark, TCP analysis, packet capture.',
  },
  {
    slug: 'esercizio-3',
    file: '03-ip-statico.txt',
    name: 'Esercizio #3 - ip-statico',
    en: 'Static IP and port forwarding. User-defined bridge, IPAM, DNAT, iptables NAT, compose.yml.',
  },
  {
    slug: 'esercizio-4',
    file: '04-routing.txt',
    name: 'Esercizio #4 - routing',
    en: 'Docker routing. Inter-VLAN routing, ip_forward, FIB, routing tables, privileged mode.',
  },
  {
    slug: 'esercizio-5',
    file: '05-programmazione-di-rete.txt',
    name: 'Esercizio #5 - programmazione-di-rete',
    en: 'Network programming. UDP/TCP sockets, gethostbyname, client-server, threading.',
  },
  {
    slug: 'esercizio-6',
    file: '06-http.txt',
    name: 'Esercizio #6 - http',
    en: 'HTTP and NGINX. Virtual hosting, NGINX configuration, CGI, PHP, event-driven model.',
  },
  {
    slug: 'esercizio-7',
    file: '07-firewall.txt',
    name: 'Esercizio #7 - firewall',
    en: 'Firewall with iptables. Netfilter, FORWARD chain, stateful inspection, conntrack, default deny.',
  },
  {
    slug: 'esercizio-8',
    file: '08-openSSL.txt',
    name: 'Esercizio #8 - openSSL',
    en: 'OpenSSL and cryptography. Base64, AES-256-CBC, MD5, HMAC-SHA256, RSA-2048, digital signatures.',
  },
  {
    slug: 'esercizio-9',
    file: '09-https.txt',
    name: 'Esercizio #9 - https',
    en: 'HTTPS and TLS. X.509 certificates, self-signed certificates, TLS handshake, SSL virtual hosts.',
  },
  {
    slug: 'esercizio-opzionale-ipv6',
    file: 'opz-IPv6.txt',
    name: 'Esercizio opzionale - IPv6',
    en: 'IPv6. Global and link-local addresses, dual stack, NDP, EUI-64, nmap over IPv6.',
  },
  {
    slug: 'esercizio-opzionale-wifi',
    file: 'opz-wifi.txt',
    name: 'Esercizio opzionale - wifi',
    en: 'WiFi. 802.11, WPA2, network scanning, wireless tcpdump, SSH between hosts.',
  },
];
