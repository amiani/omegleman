const getRandom = <T>(array: T[]) => array[Math.floor(Math.random() * array.length)];

const findAndUnshift = <T>(
	array: T[],
	find: (value: T, index?: number, obj?: T[]) => boolean
): T[] => {
	const copy = [...array]
	const index = copy.findIndex(find);
	if (index == -1) {
		return copy
	}
	const elem = copy.splice(index, 1)
	copy.unshift(elem[0])
	return copy
};

export { getRandom, findAndUnshift };
