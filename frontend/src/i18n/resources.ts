export const commonResources = {
  en: {
    common: {
      actions: {
        cancel: "Cancel",
        close: "Close",
        confirm: "Confirm",
      },
      auth: {
        login: {
          eyebrow: "Legal workspace",
          title: "Sign in",
          username: "Email or username",
          password: "Password",
          submit: "Sign in",
          submitting: "Signing in",
          errors: {
            invalidCredentials: "The username or password is incorrect.",
            network:
              "Unable to reach the server. Check your connection and try again.",
            rateLimited: "Too many sign-in attempts. Try again later.",
            rateLimitedWithSeconds:
              "Too many sign-in attempts. Try again in {{seconds}} seconds.",
          },
        },
      },
      components: {
        formErrorSummary: {
          title: "Please fix the following fields",
        },
        paginatedTable: {
          empty: "No records to show.",
          pageStatus: "Page {{page}} of {{pageCount}}",
        },
        standardStates: {
          accessDenied: "Access denied",
          forbiddenMessage: "You do not have permission to view this page.",
          loading: "Loading",
          notFoundMessage: "The page could not be found.",
          pageNotFound: "Page not found",
          requestFailed: "Request failed",
          requestFailedMessage: "The request could not be completed.",
          requestId: "Request ID {{requestId}}.",
          retryAfter: "Retry after {{seconds}} seconds.",
          requestIdWithRetry:
            "Request ID {{requestId}}. Retry after {{seconds}} seconds.",
        },
      },
      locale: {
        en: "English",
        fa: "فارسی",
      },
      routes: {
        confidentialRecord: {
          message: "The record could not be found.",
          title: "Record not found",
        },
        error: {
          message: "Refresh the page or try again shortly.",
          title: "Something went wrong",
        },
      },
      layout: {
        actions: {
          createMatter: "Create matter",
          editMatter: "Edit matter",
          runOffboarding: "Run offboarding",
          transferOwner: "Transfer owner",
          uploadDocument: "Upload document",
        },
        availableActions: "Available actions",
        localeSwitcher: "Locale switcher",
        mainNavigation: "Main navigation",
        navigation: {
          activity: "Activity",
          admin: "Admin",
          cases: "Cases",
          contracts: "Contracts",
          dashboard: "Dashboard",
          deadlines: "Deadlines",
          documents: "Documents",
          inviteUser: "Invite user",
          notices: "Notices",
          notifications: "Notifications",
          offboarding: "Offboarding",
          tasks: "Tasks",
        },
        notifications: "Notifications",
        organization: "Organization",
        readonly: {
          viewer: "Viewer access is read-only.",
        },
        signedInAs: "Signed in as",
        signedInAsName: "Signed in as {{name}}",
        signOut: "Sign out",
        workspace: "Workspace",
      },
      features: {
        adminUsers: {
          errors: {
            emailConflict: "A user with this email already exists.",
            failed: "The invitation could not be created.",
            rateLimited: "Too many invitations. Try again later.",
            rateLimitedWithSeconds:
              "Too many invitations. Try again in {{seconds}} seconds.",
          },
          form: {
            access: "Access",
            email: "Email",
            firstName: "First name",
            identity: "User identity",
            language: "Preferred language",
            lastName: "Last name",
            noPassword:
              "The invited user will choose their own password from the invitation email.",
            role: "Role",
            submit: "Send invitation",
            success: "Invitation created for {{email}}.",
          },
          management: {
            active: "Active",
            allRoles: "All roles",
            description:
              "Review active organization memberships and change user roles.",
            email: "Email",
            empty: "No users match the current filters.",
            errors: {
              failed: "The user list could not be updated.",
              lastAdmin:
                "At least one active Legal Admin must remain in the organization.",
              network: "Unable to reach the server. Check your connection.",
              permission:
                "You do not have permission to manage organization users.",
              rateLimited: "Too many role changes. Try again later.",
              rateLimitedWithSeconds:
                "Too many role changes. Try again in {{seconds}} seconds.",
              stale:
                "This membership changed while you were working. Refresh and try again.",
            },
            eyebrow: "Administration",
            inactive: "Inactive",
            invite: "Invite user",
            loading: "Loading users",
            role: "Role",
            roleFilter: "Role",
            saved: "Role updated.",
            search: "Search users",
            status: "Status",
            tableCaption: "Organization users",
            title: "Users",
            user: "User",
          },
          page: {
            back: "Back to dashboard",
            description:
              "Invite a new user into this organization without setting a password.",
            eyebrow: "Administration",
            title: "Invite user",
          },
          roles: {
            legalAdmin: "Legal Admin",
            legalCounsel: "Legal Counsel",
            legalManager: "Legal Manager",
            viewer: "Viewer",
          },
        },
        invitationAcceptance: {
          errors: {
            invalid:
              "This invitation cannot be accepted. Request a new invitation from your administrator.",
            missingToken:
              "This invitation link is missing its token. Open the full link from your invitation email.",
            rateLimited: "Too many attempts. Try again later.",
            rateLimitedWithSeconds:
              "Too many attempts. Try again in {{seconds}} seconds.",
          },
          form: {
            login: "Go to sign in",
            password: "New password",
            passwordConfirm: "Confirm new password",
            submit: "Activate account",
            success:
              "Your account is active. Sign in with your email and new password.",
          },
          page: {
            description:
              "Choose your password to finish accepting your organization invitation.",
            eyebrow: "Invitation",
            title: "Accept invitation",
          },
        },
      },
      missingKey: "Missing translation: {{key}}",
      status: {
        danger: "Needs attention",
        neutral: "Status",
        success: "Complete",
        warning: "In progress",
      },
    },
  },
  fa: {
    common: {
      actions: {
        cancel: "انصراف",
        close: "بستن",
        confirm: "تایید",
      },
      auth: {
        login: {
          eyebrow: "فضای کاری حقوقی",
          title: "ورود",
          username: "ایمیل یا نام کاربری",
          password: "گذرواژه",
          submit: "ورود",
          submitting: "در حال ورود",
          errors: {
            invalidCredentials: "نام کاربری یا گذرواژه نادرست است.",
            network: "ارتباط با سرور برقرار نشد. اتصال خود را بررسی کنید.",
            rateLimited:
              "تعداد تلاش‌های ورود بیش از حد مجاز است. بعدا تلاش کنید.",
            rateLimitedWithSeconds:
              "تعداد تلاش‌های ورود بیش از حد مجاز است. {{seconds}} ثانیه دیگر تلاش کنید.",
          },
        },
      },
      components: {
        formErrorSummary: {
          title: "لطفا این فیلدها را اصلاح کنید",
        },
        paginatedTable: {
          empty: "رکوردی برای نمایش وجود ندارد.",
          pageStatus: "صفحه {{page}} از {{pageCount}}",
        },
        standardStates: {
          accessDenied: "دسترسی رد شد",
          forbiddenMessage: "شما مجوز مشاهده این صفحه را ندارید.",
          loading: "در حال بارگذاری",
          notFoundMessage: "صفحه پیدا نشد.",
          pageNotFound: "صفحه پیدا نشد",
          requestFailed: "درخواست ناموفق بود",
          requestFailedMessage: "درخواست کامل نشد.",
          requestId: "شناسه درخواست {{requestId}}.",
          retryAfter: "{{seconds}} ثانیه دیگر تلاش کنید.",
          requestIdWithRetry:
            "شناسه درخواست {{requestId}}. {{seconds}} ثانیه دیگر تلاش کنید.",
        },
      },
      locale: {
        en: "English",
        fa: "فارسی",
      },
      routes: {
        confidentialRecord: {
          message: "رکورد پیدا نشد.",
          title: "رکورد پیدا نشد",
        },
        error: {
          message: "صفحه را تازه‌سازی کنید یا کمی بعد دوباره تلاش کنید.",
          title: "خطایی رخ داد",
        },
      },
      layout: {
        actions: {
          createMatter: "ایجاد پرونده",
          editMatter: "ویرایش پرونده",
          runOffboarding: "اجرای خروج کاربر",
          transferOwner: "انتقال مالک",
          uploadDocument: "بارگذاری سند",
        },
        availableActions: "اقدام‌های در دسترس",
        localeSwitcher: "تغییر زبان",
        mainNavigation: "ناوبری اصلی",
        navigation: {
          activity: "فعالیت‌ها",
          admin: "مدیریت",
          cases: "پرونده‌ها",
          contracts: "قراردادها",
          dashboard: "داشبورد",
          deadlines: "مهلت‌ها",
          documents: "اسناد",
          inviteUser: "دعوت کاربر",
          notices: "ابلاغ‌ها",
          notifications: "اعلان‌ها",
          offboarding: "خروج کاربر",
          tasks: "کارها",
        },
        notifications: "اعلان‌ها",
        organization: "سازمان",
        readonly: {
          viewer: "دسترسی مشاهده‌گر فقط خواندنی است.",
        },
        signedInAs: "وارد شده با",
        signedInAsName: "وارد شده با {{name}}",
        signOut: "خروج",
        workspace: "محیط کار",
      },
      features: {
        adminUsers: {
          errors: {
            emailConflict: "کاربری با این ایمیل از قبل وجود دارد.",
            failed: "دعوت‌نامه ایجاد نشد.",
            rateLimited: "تعداد دعوت‌ها بیش از حد مجاز است. بعدا تلاش کنید.",
            rateLimitedWithSeconds:
              "تعداد دعوت‌ها بیش از حد مجاز است. {{seconds}} ثانیه دیگر تلاش کنید.",
          },
          form: {
            access: "دسترسی",
            email: "ایمیل",
            firstName: "نام",
            identity: "مشخصات کاربر",
            language: "زبان ترجیحی",
            lastName: "نام خانوادگی",
            noPassword:
              "کاربر دعوت‌شده گذرواژه خود را از طریق ایمیل دعوت انتخاب می‌کند.",
            role: "نقش",
            submit: "ارسال دعوت‌نامه",
            success: "دعوت‌نامه برای {{email}} ایجاد شد.",
          },
          management: {
            active: "فعال",
            allRoles: "همه نقش‌ها",
            description:
              "عضویت‌های فعال سازمان را بررسی کنید و نقش کاربران را تغییر دهید.",
            email: "ایمیل",
            empty: "هیچ کاربری با فیلترهای فعلی پیدا نشد.",
            errors: {
              failed: "فهرست کاربران به‌روزرسانی نشد.",
              lastAdmin: "حداقل یک مدیر حقوقی فعال باید در سازمان باقی بماند.",
              network: "ارتباط با سرور برقرار نشد. اتصال خود را بررسی کنید.",
              permission: "شما مجوز مدیریت کاربران سازمان را ندارید.",
              rateLimited:
                "تعداد تغییر نقش‌ها بیش از حد مجاز است. بعدا تلاش کنید.",
              rateLimitedWithSeconds:
                "تعداد تغییر نقش‌ها بیش از حد مجاز است. {{seconds}} ثانیه دیگر تلاش کنید.",
              stale:
                "این عضویت هنگام کار شما تغییر کرده است. صفحه را تازه‌سازی کنید و دوباره تلاش کنید.",
            },
            eyebrow: "مدیریت",
            inactive: "غیرفعال",
            invite: "دعوت کاربر",
            loading: "در حال بارگذاری کاربران",
            role: "نقش",
            roleFilter: "نقش",
            saved: "نقش به‌روزرسانی شد.",
            search: "جستجوی کاربران",
            status: "وضعیت",
            tableCaption: "کاربران سازمان",
            title: "کاربران",
            user: "کاربر",
          },
          page: {
            back: "بازگشت به داشبورد",
            description:
              "یک کاربر جدید را بدون تعیین گذرواژه به این سازمان دعوت کنید.",
            eyebrow: "مدیریت",
            title: "دعوت کاربر",
          },
          roles: {
            legalAdmin: "مدیر حقوقی",
            legalCounsel: "مشاور حقوقی",
            legalManager: "مدیر پرونده‌ها",
            viewer: "مشاهده‌گر",
          },
        },
        invitationAcceptance: {
          errors: {
            invalid:
              "این دعوت‌نامه قابل پذیرش نیست. از مدیر خود دعوت‌نامه جدید بخواهید.",
            missingToken:
              "این پیوند دعوت توکن ندارد. پیوند کامل ایمیل دعوت را باز کنید.",
            rateLimited: "تعداد تلاش‌ها بیش از حد مجاز است. بعدا تلاش کنید.",
            rateLimitedWithSeconds:
              "تعداد تلاش‌ها بیش از حد مجاز است. {{seconds}} ثانیه دیگر تلاش کنید.",
          },
          form: {
            login: "رفتن به ورود",
            password: "گذرواژه جدید",
            passwordConfirm: "تکرار گذرواژه جدید",
            submit: "فعال‌سازی حساب",
            success: "حساب شما فعال شد. با ایمیل و گذرواژه جدید خود وارد شوید.",
          },
          page: {
            description:
              "برای تکمیل پذیرش دعوت سازمانی، گذرواژه خود را انتخاب کنید.",
            eyebrow: "دعوت‌نامه",
            title: "پذیرش دعوت‌نامه",
          },
        },
      },
      missingKey: "ترجمه یافت نشد: {{key}}",
      status: {
        danger: "نیازمند توجه",
        neutral: "وضعیت",
        success: "کامل",
        warning: "در حال انجام",
      },
    },
  },
} as const;
