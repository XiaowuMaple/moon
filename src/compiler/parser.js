import { error } from "../util/util";

const WHITESPACE_RE = /\s/;

const pushChild = (child, stack) => {
  stack[stack.length - 1].children.push(child);
};

const parseOpeningTag = (index, input, length, stack) => {
  let type = "";

  for (; index < length; index++) {
    const char = input[index];

    if (char === ">") {
      const element = {
        type: type,
        children: []
      };

      pushChild(element, stack);
      stack.push(element);

      index += 1;
      break;
    } else if (char === "/" && input[index + 1] === ">") {
      pushChild({
        type: type,
        children: []
      }, stack);

      index += 2;
      break;
    } else {
      type += char;
    }
  }

  return index;
};

const parseClosingTag = (index, input, length, stack) => {
  let type = "";

  for(; index < length; index++) {
    const char = input[index];

    if (char === ">") {
      index += 1;
      break;
    } else {
      type += char;
    }
  }

  const lastElement = stack.pop();
  if (type !== lastElement.type && process.env.MOON_ENV === "development") {
    error(`Unclosed tag "${lastElement.type}", expected "${type}"`);
  }

  return index;
};

const parseText = (index, input, length, stack) => {
  let content = "";

  for (; index < length; index++) {
    const char = input[index];

    if (char === "<") {
      break;
    } else {
      content += char;
    }
  }

  pushChild({
    type: "m-text",
    content: content
  }, stack);

  return index;
};

const parse = (input) => {
  const length = input.length;

  const root = {
    type: "m-fragment",
    children: []
  };

  let stack = [root];

  for (let i = 0; i < length;) {
    const char = input[i];

    if (char === "<") {
      if (input[i + 1] === "!" && input[i + 2] === "-" && input[i + 3] === "-") {
        i = parseComment(i + 4, input, length, stack);
      } else if (input[i + 1] === "/") {
        i = parseClosingTag(i + 2, input, length, stack);
      } else {
        i = parseOpeningTag(i + 1, input, length, stack);
      }
    } else {
      i = parseText(i, input, length, stack);
    }
  }

  return root;
};
