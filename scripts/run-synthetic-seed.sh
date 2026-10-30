#!/bin/bash
# ====================================================================
# Locallytrip Synthetic Community Automation Runner
# Berjalan dengan jeda acak (Gaussian / Uniform Jitter 10 - 45 menit)
# agar pola waktu tidak kaku dan tidak terdeteksi bot oleh search engine.
# ====================================================================

SECRET="prod-lt-sched-8f3a2d9b4c7f0a1e6d2c5b8e3a7f4d1c"

# Tidur secara acak antara 10 detik s/d 600 detik (0-10 menit) sebelum eksekusi
SLEEP_SECS=$(( RANDOM % 590 + 10 ))
sleep $SLEEP_SECS

# Panggil endpoint synthetic seed internal
docker exec locallytrip_app wget -q -O /dev/null \
  --header="Authorization: Bearer $SECRET" \
  --header="Content-Type: application/json" \
  --post-data='{}' \
  http://127.0.0.1:3000/api/cron/synthetic-seed
