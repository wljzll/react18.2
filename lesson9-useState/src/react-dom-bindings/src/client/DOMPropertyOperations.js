






export function setValueForProperty(node, name, value) {
    console.log(name, value, 'xxxxxxxxxxxxxxxx');
    if (value === null) {
        node.removeAttribute(name);
    } else {
        node.setAttribute(name, value);
    }
}