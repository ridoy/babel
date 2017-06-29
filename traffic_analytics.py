import os

f = open('.forever/BUCm.log', 'rw')
a = f.read()
arr = a.split('\n')
for i in range(len(arr)):
    arr[i] = arr[i].split(',');

ips = []
for entry in arr:
    if len(entry) > 2:
        ips.append(entry[1])

s = frozenset(ips)
print len(s)
