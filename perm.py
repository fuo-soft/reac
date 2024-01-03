import itertools, json

with open('./src/test/suite/alphasort.txt', 'r') as file:
    known = [l.strip() for l in file.readlines()]

with open('./src/test/suite/1000_3-5.txt', 'r') as file:
    words = []
    for i, line in enumerate(file):
        line = line.strip()
        c = len(line)
        if c == 3:
            perms = list(itertools.permutations(line))[1:]
        elif c == 4:
            perms =\
                list(map(lambda p: (line[0],) + p, itertools.permutations(line[1:])))[1:] +\
                list(map(lambda p: p + (line[-1],), itertools.permutations(line[:-1])))[1:]
        else:
            perms =\
                list(map(lambda p: (line[:2],) + p, itertools.permutations(line[2:])))[1:] +\
                list(map(lambda p: (line[0],) + p + (line[-1],), itertools.permutations(line[1:-1])))[1:] +\
                list(map(lambda p: p + (line[-2:],), itertools.permutations(line[:-2])))[1:]
        wl = [line] + list(filter(lambda x: x not in known, [''.join(p) for p in perms]))
        words.append(wl)
        #print(wl)
print(json.dumps(words))