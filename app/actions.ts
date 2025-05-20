"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Correo and contraseña son requeridos",
    );
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    const errorEntrar = error.message;

    let errorMessage = "";

    if (errorEntrar === "Password should be at least 6 characters.") {
      errorMessage = "La contraseña debe ser de al menos 6 caracteres.";
    } else {
      errorMessage = error.message;
    }
    return encodedRedirect("error", "/sign-up", errorMessage);
  } else {
    return encodedRedirect(
      "success",
      "/sign-up",
      "Gracias por registrarte! Mira tu correo, tienes un link de verificación",
    );
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const errorEntrar = error.message;

    let errorMessage = "";

    if (errorEntrar === "Email not confirmed") {
      errorMessage = "Correo no confirmado";
    } else if (errorEntrar === "Invalid login credentials") {      
      errorMessage = "Credenciales invalidas";
    } else {
      errorMessage = error.message;
    }

    return encodedRedirect("error", "/sign-in", errorMessage);
  }

  // Obtener el usuario autenticado de forma segura
  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return encodedRedirect("error", "/sign-in", "No se pudo obtener el usuario");
  }

  const userId = userData.user.id;

  // Verificamos si ya está en la tabla "usuarios"
  const { data: existingUser, error: fetchError } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", userId)
    .single();

  if (!existingUser) {
    // Si no existe, lo insertamos con un rol por defecto
    const { error: insertError } = await supabase.from("usuarios").insert({
      id: userId,
      correo: email,
      rol: "empleado", // Puedes cambiar esto si quieres
    });

    if (insertError) {
      console.error("Error al insertar usuario:", insertError.message);
      return encodedRedirect("error", "/sign-in", "Error creando el usuario");
    }
  }

  // ✅ Redirigir basado en el rol
  const rol = existingUser?.rol ?? "empleado"; // por si lo acabamos de insertar

  if (!rol) {
      return redirect("/sign-in");
  } else {
    return redirect("/protected/principal");
  }
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "El correo es requerido.");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "No se pudo restablecer la contraseña.",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Mira tu email por un link para restablecer tu contraseña.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "La contraseña y confirmar la contraseña es requerido",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Las contraseñas no coinciden",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Contraseña actualizada");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getRol() {
  const supabase = await createClient();
  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser();

  const { data: existingUser, error: fetchError } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", userData.user?.id)
    .single();

    return existingUser?.rol;
}


