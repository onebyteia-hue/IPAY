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
