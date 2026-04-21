// Guardar en local
export function saveLocalUsers(users) {
  localStorage.setItem("users_fisica", JSON.stringify(users));
}

// Obtener local
export function getLocalUsers() {
  return JSON.parse(localStorage.getItem("users_fisica")) || [];
}

export function upsertLocalUser(updatedUser) {
  const users = getLocalUsers();

  const index = users.findIndex((user) => {
    if (updatedUser.id && user.id) {
      return user.id === updatedUser.id;
    }

    return user.nombre === updatedUser.nombre && user.curso === updatedUser.curso;
  });

  if (index >= 0) {
    users[index] = { ...users[index], ...updatedUser };
  } else {
    users.push(updatedUser);
  }

  saveLocalUsers(users);
  return users;
}

export function saveLocalQuestions(questions) {
  localStorage.setItem("preguntas_fisica_local", JSON.stringify(questions));
}

export function getLocalQuestions() {
  return JSON.parse(localStorage.getItem("preguntas_fisica_local")) || [];
}

export function upsertLocalQuestion(updatedQuestion) {
  const questions = getLocalQuestions();

  const index = questions.findIndex((question) => {
    if (updatedQuestion.id && question.id) {
      return question.id === updatedQuestion.id;
    }

    return (
      question.enunciado === updatedQuestion.enunciado &&
      Number(question.nivel) === Number(updatedQuestion.nivel)
    );
  });

  if (index >= 0) {
    questions[index] = { ...questions[index], ...updatedQuestion };
  } else {
    questions.push(updatedQuestion);
  }

  saveLocalQuestions(questions);
  return questions;
}

export function deleteLocalUser(userToDelete) {
  const users = getLocalUsers().filter((user) => {
    if (userToDelete?.id && user.id) {
      return user.id !== userToDelete.id;
    }

    return !(
      user.nombre === userToDelete?.nombre &&
      user.curso === userToDelete?.curso
    );
  });

  saveLocalUsers(users);
  return users;
}

export function deleteLocalQuestion(questionToDelete) {
  const questions = getLocalQuestions().filter((question) => {
    if (questionToDelete?.id && question.id) {
      return question.id !== questionToDelete.id;
    }

    return !(
      question.enunciado === questionToDelete?.enunciado &&
      Number(question.nivel) === Number(questionToDelete?.nivel)
    );
  });

  saveLocalQuestions(questions);
  return questions;
}
